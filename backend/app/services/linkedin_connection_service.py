"""LinkedIn OAuth lifecycle behind a small tenant-scoped connection seam."""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode
from uuid import UUID

import httpx

from app.config import settings
from app.exceptions import NotFoundError, ValidationError
from app.models.social_connection import SocialConnection
from app.repositories.oauth_state_repo import OAuthStateRepository
from app.repositories.social_connection_repo import SocialConnectionRepository
from app.services.token_cipher import TokenCipher

_LINKEDIN_AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization"
_LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
_LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
_REQUIRED_SCOPES = ("openid", "profile", "w_member_social")


class LinkedInConnectionService:
    """Creates and resolves publishable personal LinkedIn connections."""

    def __init__(
        self,
        connection_repo: SocialConnectionRepository,
        state_repo: OAuthStateRepository,
        token_cipher: TokenCipher | None = None,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._connections = connection_repo
        self._states = state_repo
        self._cipher = token_cipher or TokenCipher()
        self._http = http_client

    @staticmethod
    def _state_hash(raw_state: str) -> str:
        return hashlib.sha256(raw_state.encode("utf-8")).hexdigest()

    @staticmethod
    def _require_oauth_configuration() -> None:
        missing = [
            name
            for name, value in {
                "LINKEDIN_CLIENT_ID": settings.LINKEDIN_CLIENT_ID,
                "LINKEDIN_CLIENT_SECRET": settings.LINKEDIN_CLIENT_SECRET,
                "LINKEDIN_REDIRECT_URI": settings.LINKEDIN_REDIRECT_URI,
                "TOKEN_ENCRYPTION_KEY": settings.TOKEN_ENCRYPTION_KEY,
            }.items()
            if not value
        ]
        if missing:
            raise ValidationError(f"LinkedIn OAuth is not configured: {', '.join(missing)}.")

    async def begin_connect(self, tenant_id: UUID, operator_id: UUID) -> str:
        self._require_oauth_configuration()
        raw_state = secrets.token_urlsafe(32)
        await self._states.create(
            tenant_id=tenant_id,
            operator_id=operator_id,
            provider="linkedin",
            state_hash=self._state_hash(raw_state),
            expires_at=datetime.now(UTC) + timedelta(minutes=10),
        )
        params = {
            "response_type": "code",
            "client_id": settings.LINKEDIN_CLIENT_ID,
            "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
            "state": raw_state,
            "scope": " ".join(_REQUIRED_SCOPES),
        }
        return f"{_LINKEDIN_AUTHORIZE_URL}?{urlencode(params)}"

    async def complete_callback(self, code: str, raw_state: str) -> SocialConnection:
        if not code or not raw_state:
            raise ValidationError("LinkedIn callback must include both code and state.")
        self._require_oauth_configuration()
        oauth_state = await self._states.consume("linkedin", self._state_hash(raw_state))
        if oauth_state is None:
            raise ValidationError("LinkedIn authorization state is invalid, expired, or already used.")

        async def exchange(client: httpx.AsyncClient) -> SocialConnection:
            token_response = await client.post(
                _LINKEDIN_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
                    "client_id": settings.LINKEDIN_CLIENT_ID,
                    "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_response.raise_for_status()
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise ValidationError("LinkedIn did not return an access token.")

            profile_response = await client.get(
                _LINKEDIN_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            profile_response.raise_for_status()
            profile = profile_response.json()
            subject = profile.get("sub")
            if not subject:
                raise ValidationError("LinkedIn did not return a member identity.")

            expires_in = int(token_data.get("expires_in", 0) or 0)
            expires_at = datetime.now(UTC) + timedelta(seconds=expires_in) if expires_in else None
            scopes = str(token_data.get("scope", " ".join(_REQUIRED_SCOPES))).split()
            return await self._connections.upsert_linkedin(
                tenant_id=oauth_state.tenant_id,
                operator_id=oauth_state.operator_id,
                subject=subject,
                author_urn=f"urn:li:person:{subject}",
                display_name=profile.get("name"),
                access_token_encrypted=self._cipher.encrypt(access_token),
                refresh_token_encrypted=(
                    self._cipher.encrypt(token_data["refresh_token"])
                    if token_data.get("refresh_token")
                    else None
                ),
                expires_at=expires_at,
                granted_scopes=scopes,
            )

        if self._http is not None:
            return await exchange(self._http)
        async with httpx.AsyncClient(timeout=20.0) as client:
            return await exchange(client)

    async def list_connections(self, tenant_id: UUID, operator_id: UUID) -> list[SocialConnection]:
        return await self._connections.list_for_operator(tenant_id, operator_id)

    async def disconnect(self, connection_id: UUID, tenant_id: UUID, operator_id: UUID) -> None:
        connection = await self._connections.get_owned(connection_id, tenant_id, operator_id)
        if connection is None:
            raise NotFoundError("Social connection not found.")
        await self._connections.mark_status(connection, "disconnected")

    async def get_publishable_connection(
        self, connection_id: UUID, tenant_id: UUID, operator_id: UUID
    ) -> SocialConnection:
        connection = await self._connections.get_owned(connection_id, tenant_id, operator_id)
        if connection is None:
            raise NotFoundError("Social connection not found.")
        if connection.expires_at and connection.expires_at <= datetime.now(UTC):
            await self._connections.mark_status(connection, "reconnect_required", "LinkedIn access token expired.")
            raise ValidationError("LinkedIn connection expired; reconnect it before publishing.")
        if not connection.is_publishable:
            raise ValidationError("Selected LinkedIn connection is not publishable.")
        return connection

    def decrypt_access_token(self, connection: SocialConnection) -> str:
        return self._cipher.decrypt(connection.access_token_encrypted)


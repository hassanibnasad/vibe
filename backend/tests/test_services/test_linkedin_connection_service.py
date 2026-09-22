import uuid
from datetime import UTC, datetime, timedelta

import httpx
import pytest
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.exceptions import ValidationError
from app.repositories.oauth_state_repo import OAuthStateRepository
from app.repositories.social_connection_repo import SocialConnectionRepository
from app.services.linkedin_connection_service import LinkedInConnectionService


@pytest.fixture(autouse=True)
def configure_oauth(monkeypatch):
    monkeypatch.setattr(settings, "LINKEDIN_CLIENT_ID", "test-client-id")
    monkeypatch.setattr(settings, "LINKEDIN_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setattr(settings, "LINKEDIN_REDIRECT_URI", "https://api.vibeagent.dev/api/v1/connectors/linkedin/callback")
    monkeypatch.setattr(settings, "TOKEN_ENCRYPTION_KEY", Fernet.generate_key().decode("utf-8"))


@pytest.mark.asyncio
async def test_begin_connect_creates_oauth_state(db_session: AsyncSession):
    state_repo = OAuthStateRepository(db_session)
    conn_repo = SocialConnectionRepository(db_session)
    service = LinkedInConnectionService(connection_repo=conn_repo, state_repo=state_repo)

    tenant_id = uuid.uuid4()
    operator_id = uuid.uuid4()

    auth_url = await service.begin_connect(tenant_id, operator_id)
    assert "https://www.linkedin.com/oauth/v2/authorization" in auth_url
    assert "client_id=test-client-id" in auth_url
    assert "state=" in auth_url


@pytest.mark.asyncio
async def test_complete_callback_exchanges_token_and_persists_connection(db_session: AsyncSession):
    state_repo = OAuthStateRepository(db_session)
    conn_repo = SocialConnectionRepository(db_session)
    service = LinkedInConnectionService(connection_repo=conn_repo, state_repo=state_repo)

    tenant_id = uuid.uuid4()
    operator_id = uuid.uuid4()

    # Step 1: begin connect
    raw_state = "test_raw_state_1234567890abcdef"
    state_hash = service._state_hash(raw_state)
    await state_repo.create(
        tenant_id=tenant_id,
        operator_id=operator_id,
        provider="linkedin",
        state_hash=state_hash,
        expires_at=datetime.now(UTC) + timedelta(minutes=10),
    )

    # Step 2: mock HTTP responses for token exchange and userinfo
    async def mock_handler(request: httpx.Request):
        if "accessToken" in str(request.url):
            return httpx.Response(
                200,
                json={
                    "access_token": "mock-access-token-12345",
                    "expires_in": 5184000,
                    "scope": "openid profile w_member_social",
                },
            )
        if "userinfo" in str(request.url):
            return httpx.Response(
                200,
                json={
                    "sub": "linkedin-sub-xyz",
                    "name": "Alex Founder",
                },
            )
        return httpx.Response(404)

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(mock_handler))
    service._http = mock_client

    connection = await service.complete_callback(code="auth-code-123", raw_state=raw_state)

    assert connection.tenant_id == tenant_id
    assert connection.operator_id == operator_id
    assert connection.author_urn == "urn:li:person:linkedin-sub-xyz"
    assert connection.display_name == "Alex Founder"
    assert connection.status == "active"
    assert service.decrypt_access_token(connection) == "mock-access-token-12345"

    # Verify state cannot be reused
    with pytest.raises(ValidationError, match="invalid, expired, or already used"):
        await service.complete_callback(code="auth-code-123", raw_state=raw_state)

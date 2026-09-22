"""Operator-owned LinkedIn connection endpoints."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import DEFAULT_TENANT_ID, get_db_session
from app.middleware.auth import get_current_user
from app.repositories.oauth_state_repo import OAuthStateRepository
from app.repositories.social_connection_repo import SocialConnectionRepository
from app.services.linkedin_connection_service import LinkedInConnectionService

router = APIRouter(prefix="/connectors", tags=["Connectors"])


class ConnectionResponse(BaseModel):
    id: UUID
    provider: str
    display_name: str | None
    author_urn: str
    status: str
    expires_at: datetime | None
    granted_scopes: list[str]
    last_error: str | None
    connected_at: datetime | None

    model_config = {"from_attributes": True}


def _identity(current_user: dict) -> tuple[UUID, UUID]:
    operator_id = UUID(str(current_user.get("id", DEFAULT_TENANT_ID)))
    tenant_id = UUID(str(current_user.get("tenant_id", DEFAULT_TENANT_ID)))
    return tenant_id, operator_id


def _service(session: AsyncSession) -> LinkedInConnectionService:
    return LinkedInConnectionService(
        connection_repo=SocialConnectionRepository(session),
        state_repo=OAuthStateRepository(session),
    )


@router.get("/linkedin/authorize", status_code=status.HTTP_302_FOUND)
async def begin_linkedin_authorization(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> RedirectResponse:
    tenant_id, operator_id = _identity(current_user)
    url = await _service(session).begin_connect(tenant_id, operator_id)
    return RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)


@router.get("/linkedin/callback")
async def complete_linkedin_authorization(
    code: str,
    state: str,
    session: AsyncSession = Depends(get_db_session),
) -> RedirectResponse:
    await _service(session).complete_callback(code, state)
    return RedirectResponse(
        url=f"{settings.FRONTEND_BASE_URL}/connections?linkedin=connected",
        status_code=status.HTTP_303_SEE_OTHER,
    )


@router.get("", response_model=list[ConnectionResponse])
async def list_connections(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[ConnectionResponse]:
    tenant_id, operator_id = _identity(current_user)
    return await _service(session).list_connections(tenant_id, operator_id)


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_connection(
    connection_id: UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    tenant_id, operator_id = _identity(current_user)
    try:
        await _service(session).disconnect(connection_id, tenant_id, operator_id)
    except HTTPException:
        raise


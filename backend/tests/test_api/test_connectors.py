import uuid
from unittest.mock import AsyncMock, patch

import pytest
from cryptography.fernet import Fernet
from httpx import AsyncClient

from app.config import settings
from app.models.social_connection import SocialConnection


@pytest.fixture(autouse=True)
def configure_oauth(monkeypatch):
    monkeypatch.setattr(settings, "LINKEDIN_CLIENT_ID", "test-client-id")
    monkeypatch.setattr(settings, "LINKEDIN_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setattr(settings, "LINKEDIN_REDIRECT_URI", "https://api.vibeagent.dev/api/v1/connectors/linkedin/callback")
    monkeypatch.setattr(settings, "TOKEN_ENCRYPTION_KEY", Fernet.generate_key().decode("utf-8"))


@pytest.mark.asyncio
async def test_begin_linkedin_authorization(client: AsyncClient):
    response = await client.get("/api/v1/connectors/linkedin/authorize", follow_redirects=False)
    assert response.status_code == 302
    assert "https://www.linkedin.com/oauth/v2/authorization" in response.headers["location"]


@pytest.mark.asyncio
async def test_list_connectors_empty(client: AsyncClient):
    response = await client.get("/api/v1/connectors")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_complete_linkedin_callback_redirects(client: AsyncClient):
    with patch(
        "app.services.linkedin_connection_service.LinkedInConnectionService.complete_callback",
        new_callable=AsyncMock,
    ) as mock_complete:
        mock_conn = SocialConnection(
            id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            operator_id=uuid.uuid4(),
            provider="linkedin",
            external_subject="sub-123",
            author_urn="urn:li:person:sub-123",
            access_token_encrypted="enc",
            status="active",
        )
        mock_complete.return_value = mock_conn

        response = await client.get(
            "/api/v1/connectors/linkedin/callback?code=mock_code&state=mock_state",
            follow_redirects=False,
        )
        assert response.status_code == 303
        assert "linkedin=connected" in response.headers["location"]

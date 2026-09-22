import uuid
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import AgentResult
from app.exceptions import ValidationError
from app.models.enums import PostStatus
from app.models.social_connection import SocialConnection
from app.repositories.post_repo import PostRepository
from app.repositories.publication_attempt_repo import PublicationAttemptRepository
from app.services.linkedin_connection_service import LinkedInConnectionService
from app.services.publication_service import PublicationService


@pytest.mark.asyncio
async def test_publication_service_publish_approved_post(db_session: AsyncSession):
    post_repo = PostRepository(db_session)
    attempt_repo = PublicationAttemptRepository(db_session)

    tenant_id = uuid.uuid4()
    operator_id = uuid.uuid4()
    connection_id = uuid.uuid4()

    post = await post_repo.create(
        tenant_id=tenant_id,
        content="Approved post ready for LinkedIn",
        status=PostStatus.APPROVED.value,
        requires_review=False,
    )

    mock_connection = SocialConnection(
        id=connection_id,
        tenant_id=tenant_id,
        operator_id=operator_id,
        provider="linkedin",
        external_subject="linkedin-sub-123",
        author_urn="urn:li:person:sub-123",
        display_name="Jane Doe",
        access_token_encrypted="encrypted-token",
        status="active",
    )

    mock_conn_service = AsyncMock(spec=LinkedInConnectionService)
    mock_conn_service.get_publishable_connection.return_value = mock_connection
    mock_conn_service.decrypt_access_token.return_value = "decrypted-plain-token"

    service = PublicationService(
        post_repo=post_repo,
        attempts=attempt_repo,
        connections=mock_conn_service,
    )

    with patch("app.services.publication_service.LinkedInTool.publish_post", new_callable=AsyncMock) as mock_pub:
        mock_pub.return_value = AgentResult(
            agent_name="LinkedInTool",
            success=True,
            confidence_score=1.0,
            requires_review=False,
            data={
                "platform_post_id": "urn:li:share:12345",
                "platform_post_url": "https://www.linkedin.com/feed/update/urn:li:share:12345/",
            },
        )

        published = await service.publish(
            post_id=post.id,
            connection_id=connection_id,
            tenant_id=tenant_id,
            operator_id=operator_id,
        )

    assert published.status == PostStatus.PUBLISHED.value
    assert published.platform_post_id == "urn:li:share:12345"
    assert published.social_connection_id == connection_id

    # Verify attempt recorded
    attempt = await attempt_repo.get_for_post_and_connection(post.id, connection_id)
    assert attempt is not None
    assert attempt.status == "succeeded"
    assert attempt.platform_post_id == "urn:li:share:12345"


@pytest.mark.asyncio
async def test_publication_service_rejects_unapproved_post(db_session: AsyncSession):
    post_repo = PostRepository(db_session)
    attempt_repo = PublicationAttemptRepository(db_session)

    tenant_id = uuid.uuid4()
    operator_id = uuid.uuid4()
    connection_id = uuid.uuid4()

    post = await post_repo.create(
        tenant_id=tenant_id,
        content="Draft post not yet approved",
        status=PostStatus.DRAFT.value,
        requires_review=True,
    )

    mock_conn_service = AsyncMock(spec=LinkedInConnectionService)
    service = PublicationService(
        post_repo=post_repo,
        attempts=attempt_repo,
        connections=mock_conn_service,
    )

    with pytest.raises(ValidationError, match="Only an approved Draft can be published"):
        await service.publish(
            post_id=post.id,
            connection_id=connection_id,
            tenant_id=tenant_id,
            operator_id=operator_id,
        )

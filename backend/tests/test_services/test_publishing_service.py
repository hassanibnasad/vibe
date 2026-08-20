from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.publisher import PublisherAgent
from app.exceptions import ValidationError
from app.repositories.post_repo import PostRepository
from app.services.publishing_service import PublishingService
from app.tools.platform.base import PublishResult


@pytest.mark.asyncio
async def test_publishing_service_publish_now(db_session: AsyncSession):
    post_repo = PostRepository(db_session)
    post = await post_repo.create(
        content="Testing publishing service directly",
        status="approved",
    )

    mock_agent = AsyncMock(spec=PublisherAgent)
    mock_agent.publish_post.return_value = AsyncMock(
        success=True,
        confidence_score=1.0,
        data={
            "platform": "linkedin",
            "platform_post_id": "urn:li:share:pub123",
            "platform_post_url": "https://www.linkedin.com/feed/update/urn:li:share:pub123/",
        },
    )

    service = PublishingService(post_repo=post_repo, publisher_agent=mock_agent)
    published_post = await service.publish_now(post.id)

    assert published_post.status == "published"
    assert published_post.platform_post_id == "urn:li:share:pub123"
    assert published_post.published_at is not None


@pytest.mark.asyncio
async def test_publishing_service_schedule(db_session: AsyncSession):
    post_repo = PostRepository(db_session)
    post = await post_repo.create(
        content="Post for future publishing",
        status="approved",
    )

    service = PublishingService(post_repo=post_repo)
    future_time = datetime.now(UTC) + timedelta(days=2)
    scheduled_post = await service.schedule(post.id, scheduled_at=future_time)

    assert scheduled_post.status == "scheduled"
    # Compare timestamps or normalized time
    actual_dt = scheduled_post.scheduled_at
    if actual_dt.tzinfo is None:
        actual_dt = actual_dt.replace(tzinfo=UTC)
    assert abs((actual_dt - future_time).total_seconds()) < 1

    # Attempting to schedule in the past should raise ValidationError
    past_time = datetime.now(UTC) - timedelta(hours=1)
    with pytest.raises(ValidationError):
        await service.schedule(post.id, scheduled_at=past_time)

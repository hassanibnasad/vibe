from uuid import UUID
import structlog

from app.dependencies import get_sessionmaker
from app.repositories.post_repo import PostRepository
from app.services.publishing_service import PublishingService

logger = structlog.get_logger()


async def execute_scheduled_publish_job() -> dict:
    """Cron-triggered task to find and publish all due scheduled posts."""
    session_factory = get_sessionmaker()
    async with session_factory() as session:
        post_repo = PostRepository(session)
        service = PublishingService(post_repo=post_repo)
        published = await service.dispatch_due_scheduled_posts()
        await session.commit()
        return {
            "status": "success",
            "published_count": len(published),
            "post_ids": [str(p.id) for p in published],
        }


async def execute_single_post_publish_job(post_id: UUID) -> dict:
    """Worker job to publish a specific post with retries."""
    session_factory = get_sessionmaker()
    async with session_factory() as session:
        post_repo = PostRepository(session)
        service = PublishingService(post_repo=post_repo)
        post = await service.publish_now(post_id=post_id)
        await session.commit()
        return {
            "status": post.status,
            "post_id": str(post.id),
            "platform_post_id": post.platform_post_id,
            "error_message": post.error_message,
        }

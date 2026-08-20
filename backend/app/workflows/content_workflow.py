from uuid import UUID
import structlog

from app.dependencies import get_sessionmaker
from app.repositories.post_repo import PostRepository
from app.services.content_service import ContentService
from app.services.publishing_service import PublishingService

logger = structlog.get_logger()


async def execute_content_pipeline(
    brief: str,
    platform_id: UUID,
    platform_type: str = "linkedin",
    tone: str = "professional",
    auto_publish: bool = False,
) -> dict:
    """Orchestrates: Generate -> Save Draft -> (Optional Auto-Publish if high confidence)."""
    session_factory = get_sessionmaker()
    async with session_factory() as session:
        post_repo = PostRepository(session)
        content_service = ContentService(post_repo=post_repo)

        # 1. Generate post
        post = await content_service.generate_and_save_draft(
            brief=brief,
            platform_id=platform_id,
            platform_type=platform_type,
            tone=tone,
        )

        # 2. If auto_publish is requested and no review required
        if auto_publish and not post.requires_review:
            pub_service = PublishingService(post_repo=post_repo)
            post = await pub_service.publish_now(post_id=post.id, platform_type=platform_type)

        await session.commit()
        return {
            "post_id": str(post.id),
            "status": post.status,
            "requires_review": post.requires_review,
            "confidence_score": post.confidence_score,
            "platform_post_url": post.platform_post_url,
        }

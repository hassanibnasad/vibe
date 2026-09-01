"""
Content pipeline Hatchet task.

Replaces the former plain async function with a proper @hatchet.task so that
all invocations go through the Hatchet engine and gain retry, observability,
and durable-execution guarantees defined in CONTEXT.md.
"""

import datetime
from uuid import UUID

import structlog
from hatchet_sdk import Context
from pydantic import BaseModel

from app.hatchet_client import hatchet

logger = structlog.get_logger()


class ContentPipelineInput(BaseModel):
    """Input schema for the content-pipeline task."""

    brief: str
    platform_id: str
    platform_type: str = "linkedin"
    tone: str = "professional"
    campaign_id: str | None = None
    variants_count: int = 1
    auto_publish: bool = False


@hatchet.task(
    name="content-pipeline",
    input_validator=ContentPipelineInput,
    retries=2,
    execution_timeout=datetime.timedelta(minutes=5),
)
async def content_pipeline_task(
    input: ContentPipelineInput,
    ctx: Context,
) -> dict:
    """Orchestrates: Generate → Save Draft → (Optional Auto-Publish if high confidence)."""
    from app.dependencies import get_sessionmaker  # noqa: PLC0415
    from app.repositories.post_repo import PostRepository  # noqa: PLC0415
    from app.services.content_service import ContentService  # noqa: PLC0415

    platform_id = UUID(input.platform_id)
    campaign_id = UUID(input.campaign_id) if input.campaign_id else None

    session_factory = get_sessionmaker()
    async with session_factory() as session:
        post_repo = PostRepository(session)
        content_service = ContentService(post_repo=post_repo)

        if input.variants_count > 1:
            posts = await content_service.generate_and_save_variants(
                brief=input.brief,
                platform_id=platform_id,
                platform_type=input.platform_type,
                tone=input.tone,
                campaign_id=campaign_id,
                variants_count=input.variants_count,
            )
            await session.commit()
            logger.info(
                "content_pipeline_variants_completed",
                variants_count=len(posts),
                post_ids=[str(p.id) for p in posts],
            )
            return {
                "post_id": str(posts[0].id),
                "post_ids": [str(p.id) for p in posts],
                "status": posts[0].status,
                "requires_review": posts[0].requires_review,
                "confidence_score": posts[0].confidence_score,
                "platform_post_url": posts[0].platform_post_url,
            }

        # 1. Single post generation
        post = await content_service.generate_and_save_draft(
            brief=input.brief,
            platform_id=platform_id,
            platform_type=input.platform_type,
            tone=input.tone,
            campaign_id=campaign_id,
        )

        # 2. Auto-publish if requested and confidence is high enough
        if input.auto_publish and not post.requires_review:
            post = await content_service.publish_now(post_id=post.id, platform_type=input.platform_type)

        await session.commit()

    logger.info(
        "content_pipeline_completed",
        post_id=str(post.id),
        status=post.status,
        requires_review=post.requires_review,
    )

    return {
        "post_id": str(post.id),
        "post_ids": [str(post.id)],
        "status": post.status,
        "requires_review": post.requires_review,
        "confidence_score": post.confidence_score,
        "platform_post_url": post.platform_post_url,
    }

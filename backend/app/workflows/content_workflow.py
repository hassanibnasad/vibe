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
    from app.services.publishing_service import PublishingService  # noqa: PLC0415

    platform_id = UUID(input.platform_id)

    session_factory = get_sessionmaker()
    async with session_factory() as session:
        post_repo = PostRepository(session)
        content_service = ContentService(post_repo=post_repo)

        # 1. Generate post and save draft
        post = await content_service.generate_and_save_draft(
            brief=input.brief,
            platform_id=platform_id,
            platform_type=input.platform_type,
            tone=input.tone,
        )

        # 2. Auto-publish if requested and confidence is high enough
        if input.auto_publish and not post.requires_review:
            pub_service = PublishingService(post_repo=post_repo)
            post = await pub_service.publish_now(post_id=post.id, platform_type=input.platform_type)

        await session.commit()

    logger.info(
        "content_pipeline_completed",
        post_id=str(post.id),
        status=post.status,
        requires_review=post.requires_review,
    )

    return {
        "post_id": str(post.id),
        "status": post.status,
        "requires_review": post.requires_review,
        "confidence_score": post.confidence_score,
        "platform_post_url": post.platform_post_url,
    }

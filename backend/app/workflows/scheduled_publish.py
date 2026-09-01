"""
Scheduled-publish Hatchet tasks.

Two tasks:
  1. ``scheduled_publish_cron_workflow`` — a cron-triggered workflow that
     dispatches all posts whose ``scheduled_at`` time has passed. Runs every
     minute via Hatchet's native cron support.

  2. ``publish_single_post_task`` — an on-demand standalone task triggered
     from the ``POST /posts/{id}/publish`` endpoint. Runs with retries=3 so
     that transient platform API errors are automatically retried.
"""

import datetime
from uuid import UUID

import structlog
from hatchet_sdk import Context, EmptyModel
from pydantic import BaseModel

from app.hatchet_client import hatchet

logger = structlog.get_logger()


# ──────────────────────────────────────────────────────────────────────────────
# 1. Cron workflow — dispatch all due scheduled posts every minute
# ──────────────────────────────────────────────────────────────────────────────

scheduled_publish_cron_workflow = hatchet.workflow(
    name="ScheduledPublishCron",
    on_crons=["* * * * *"],
)


@scheduled_publish_cron_workflow.task(
    execution_timeout=datetime.timedelta(minutes=3),
)
async def dispatch_due_posts_task(input: EmptyModel, ctx: Context) -> dict:
    """Cron-triggered task: find and publish all posts whose scheduled_at has passed."""
    from app.dependencies import get_sessionmaker  # noqa: PLC0415
    from app.repositories.post_repo import PostRepository  # noqa: PLC0415
    from app.services.content_service import ContentService  # noqa: PLC0415

    session_factory = get_sessionmaker()
    async with session_factory() as session:
        post_repo = PostRepository(session)
        service = ContentService(post_repo=post_repo)
        published = await service.dispatch_due_scheduled_posts()
        await session.commit()

    logger.info("scheduled_publish_completed", published_count=len(published))
    return {
        "status": "success",
        "published_count": len(published),
        "post_ids": [str(p.id) for p in published],
    }


# ──────────────────────────────────────────────────────────────────────────────
# 2. On-demand standalone task — publish a single post with retries
# ──────────────────────────────────────────────────────────────────────────────


class PublishSinglePostInput(BaseModel):
    """Input schema for the publish-single-post task."""

    post_id: str


@hatchet.task(
    name="publish-single-post",
    input_validator=PublishSinglePostInput,
    retries=3,
    execution_timeout=datetime.timedelta(minutes=3),
)
async def publish_single_post_task(
    input: PublishSinglePostInput,
    ctx: Context,
) -> dict:
    """On-demand task: publish a specific post with automatic retries on failure."""
    from app.dependencies import get_sessionmaker  # noqa: PLC0415
    from app.repositories.post_repo import PostRepository  # noqa: PLC0415
    from app.services.content_service import ContentService  # noqa: PLC0415

    post_id = UUID(input.post_id)

    session_factory = get_sessionmaker()
    async with session_factory() as session:
        post_repo = PostRepository(session)
        service = ContentService(post_repo=post_repo)
        post = await service.publish_now(post_id=post_id)
        await session.commit()

    logger.info("single_post_publish_completed", post_id=str(post.id), status=post.status)
    return {
        "status": post.status,
        "post_id": str(post.id),
        "platform_post_id": post.platform_post_id,
        "error_message": post.error_message,
    }

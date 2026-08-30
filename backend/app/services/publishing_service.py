from datetime import UTC, datetime
from uuid import UUID

import structlog

from app.agents.publisher import PublisherAgent
from app.exceptions import PostNotFoundError, ValidationError
from app.models.enums import PostStatus
from app.models.post import Post
from app.repositories.post_repo import PostRepository

logger = structlog.get_logger()


class PublishingService:
    """Service handling post publishing lifecycle, dispatching, and retry orchestration."""

    def __init__(
        self,
        post_repo: PostRepository,
        publisher_agent: PublisherAgent | None = None,
    ):
        self.post_repo = post_repo
        self.agent = publisher_agent or PublisherAgent()

    async def publish_now(self, post_id: UUID, platform_type: str = "linkedin") -> Post:
        """Immediately dispatch an approved or draft post to the platform."""
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError(f"Post {post_id} not found.")

        # Update to publishing state
        await self.post_repo.update(post_id, status=PostStatus.PUBLISHING.value)

        # Execute via PublisherAgent
        result = await self.agent.publish_post(
            platform=platform_type,
            content=post.content,
            media_urls=post.media_urls or [],
            hashtags=post.hashtags or [],
            cta=post.cta,
        )

        if result.success:
            updated = await self.post_repo.update(
                post_id,
                status=PostStatus.PUBLISHED.value,
                published_at=datetime.now(UTC),
                platform_post_id=result.data.get("platform_post_id"),
                platform_post_url=result.data.get("platform_post_url"),
                error_message=None,
            )
            logger.info("post_published_successfully", post_id=str(post_id), url=result.data.get("platform_post_url"))
            return updated  # type: ignore[return-value]
        else:
            updated = await self.post_repo.update(
                post_id,
                status=PostStatus.FAILED.value,
                error_message=result.data.get("error", "Unknown publishing error"),
                retry_count=post.retry_count + 1,
            )
            logger.error("post_publishing_failed", post_id=str(post_id), error=result.data.get("error"))
            return updated  # type: ignore[return-value]

    async def schedule(self, post_id: UUID, scheduled_at: datetime) -> Post:
        """Schedule a post for future automated dispatch."""
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError(f"Post {post_id} not found.")

        if scheduled_at <= datetime.now(UTC):
            raise ValidationError("Scheduled time must be in the future.")

        updated = await self.post_repo.update(
            post_id,
            status=PostStatus.SCHEDULED.value,
            scheduled_at=scheduled_at,
        )
        logger.info("post_scheduled", post_id=str(post_id), scheduled_at=scheduled_at.isoformat())
        return updated  # type: ignore[return-value]

    async def dispatch_due_scheduled_posts(self) -> list[Post]:
        """Find and publish all scheduled posts that have reached their target time."""
        now = datetime.now(UTC)
        due_posts = await self.post_repo.get_due_scheduled_posts(current_time=now)
        published_posts: list[Post] = []

        logger.info("checking_due_scheduled_posts", count=len(due_posts))
        for post in due_posts:
            published = await self.publish_now(post.id)
            published_posts.append(published)

        return published_posts

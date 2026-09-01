from datetime import datetime
from uuid import UUID

from app.agents.publisher import PublisherAgent
from app.models.post import Post
from app.repositories.post_repo import PostRepository
from app.services.content_service import ContentService


class PublishingService:
    """Publishing adapter delegating to the unified deep ContentService."""

    def __init__(
        self,
        post_repo: PostRepository,
        publisher_agent: PublisherAgent | None = None,
        content_service: ContentService | None = None,
    ):
        self.content_service = content_service or ContentService(
            post_repo=post_repo,
            publisher_agent=publisher_agent,
        )

    async def publish_now(self, post_id: UUID, platform_type: str = "linkedin") -> Post:
        return await self.content_service.publish_now(post_id, platform_type=platform_type)

    async def schedule(self, post_id: UUID, scheduled_at: datetime) -> Post:
        return await self.content_service.schedule(post_id, scheduled_at=scheduled_at)

    async def dispatch_due_scheduled_posts(self) -> list[Post]:
        return await self.content_service.dispatch_due_scheduled_posts()

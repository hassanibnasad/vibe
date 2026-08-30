from datetime import datetime
from typing import Any
from uuid import UUID

import structlog

from app.agents.content_generator import ContentGeneratorAgent
from app.exceptions import PostNotFoundError
from app.models.enums import PostStatus
from app.models.post import Post
from app.repositories.post_repo import PostRepository

logger = structlog.get_logger()


class ContentService:
    """Deep domain service for AI content generation, copy variant optimization, and post lifecycle management."""

    def __init__(
        self,
        post_repo: PostRepository,
        agent: ContentGeneratorAgent | None = None,
    ):
        self.post_repo = post_repo
        self.agent = agent or ContentGeneratorAgent()

    async def get_post(self, post_id: UUID) -> Post:
        """Retrieve post by ID or raise PostNotFoundError."""
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError(f"Post {post_id} not found")
        return post

    async def list_posts(
        self,
        status_filter: str | None = None,
        platform_id: UUID | None = None,
        campaign_id: UUID | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Post], int]:
        """List and paginate posts with criteria filtering."""
        return await self.post_repo.filter_posts(
            status=status_filter,
            platform_id=platform_id,
            campaign_id=campaign_id,
            skip=skip,
            limit=limit,
        )

    async def create_manual_post(
        self,
        content: str,
        platform_id: UUID | None = None,
        campaign_id: UUID | None = None,
        scheduled_at: datetime | None = None,
        media_urls: list[str] | None = None,
        hashtags: list[str] | None = None,
        cta: str | None = None,
        **extra_fields: Any,
    ) -> Post:
        """Create a human-authored post ready for scheduling or staging."""
        status = PostStatus.SCHEDULED.value if scheduled_at else PostStatus.DRAFT.value
        post = await self.post_repo.create(
            platform_id=platform_id,
            campaign_id=campaign_id,
            content=content,
            status=status,
            scheduled_at=scheduled_at,
            media_urls=media_urls or [],
            hashtags=hashtags or [],
            cta=cta,
            ai_generated=False,
            requires_review=False,
            **extra_fields,
        )
        logger.info("manual_post_created", post_id=str(post.id), status=post.status)
        return post

    async def update_post(self, post_id: UUID, **update_data: Any) -> Post:
        """Update draft or scheduled post fields."""
        await self.get_post(post_id)
        updated = await self.post_repo.update(post_id, **update_data)
        return updated  # type: ignore[return-value]

    async def delete_post(self, post_id: UUID) -> bool:
        """Delete post by ID."""
        await self.get_post(post_id)
        return await self.post_repo.delete(post_id)

    async def generate_and_save_draft(
        self,
        brief: str,
        platform_id: UUID,
        platform_type: str = "linkedin",
        tone: str = "professional",
        campaign_id: UUID | None = None,
        campaign_context: str | None = None,
        model: str | None = None,
    ) -> Post:
        logger.info("content_service_generate_draft", platform=platform_type, tone=tone)

        agent_result = await self.agent.generate_post(
            brief=brief,
            platform=platform_type,
            tone=tone,
            campaign_context=campaign_context,
            model=model,
        )

        content = agent_result.data.get("content", "")
        hashtags = agent_result.data.get("hashtags", [])
        cta = agent_result.data.get("cta", "")
        rag_sources = agent_result.data.get("rag_sources", [])

        # Store draft post
        post = await self.post_repo.create(
            platform_id=platform_id,
            campaign_id=campaign_id,
            content=content,
            status=PostStatus.DRAFT.value,
            ai_generated=True,
            confidence_score=agent_result.confidence_score,
            requires_review=agent_result.requires_review,
            generation_prompt=brief,
            rag_sources=rag_sources,
            metadata_={
                "tone": tone,
                "hashtags": hashtags,
                "cta": cta,
                "tokens_used": agent_result.data.get("tokens_used", 0),
                "latency_ms": agent_result.data.get("latency_ms", 0),
                "model_used": agent_result.data.get("model_used"),
            },
        )

        logger.info(
            "draft_post_created",
            post_id=str(post.id),
            confidence=post.confidence_score,
            requires_review=post.requires_review,
        )
        return post

    async def generate_and_save_variants(
        self,
        brief: str,
        platform_id: UUID,
        platform_type: str = "linkedin",
        tone: str = "professional",
        campaign_id: UUID | None = None,
        campaign_context: str | None = None,
        variants_count: int = 3,
        model: str | None = None,
    ) -> list[Post]:
        """Generate and save multiple copy variants for A/B testing."""
        logger.info("content_service_generate_variants", platform=platform_type, count=variants_count)

        agent_results = await self.agent.generate_variants(
            brief=brief,
            platform=platform_type,
            tone=tone,
            campaign_context=campaign_context,
            variants_count=variants_count,
            model=model,
        )

        posts: list[Post] = []
        for result in agent_results:
            content = result.data.get("content", "")
            hashtags = result.data.get("hashtags", [])
            cta = result.data.get("cta", "")
            rag_sources = result.data.get("rag_sources", [])
            variant_label = result.data.get("variant_label")
            variant_group_str = result.data.get("variant_group")
            variant_group_uuid = UUID(variant_group_str) if variant_group_str else None

            post = await self.post_repo.create(
                platform_id=platform_id,
                campaign_id=campaign_id,
                content=content,
                status=PostStatus.DRAFT.value,
                ai_generated=True,
                confidence_score=result.confidence_score,
                requires_review=result.requires_review,
                generation_prompt=brief,
                rag_sources=rag_sources,
                variant_label=variant_label,
                variant_group=variant_group_uuid,
                metadata_={
                    "tone": tone,
                    "hashtags": hashtags,
                    "cta": cta,
                    "tokens_used": result.data.get("tokens_used", 0),
                    "latency_ms": result.data.get("latency_ms", 0),
                    "model_used": result.data.get("model_used"),
                },
            )
            posts.append(post)

        return posts

    async def approve_post(self, post_id: UUID) -> Post:
        await self.get_post(post_id)
        updated = await self.post_repo.update(
            post_id,
            status=PostStatus.APPROVED.value,
            requires_review=False,
        )
        logger.info("post_approved", post_id=str(post_id))
        return updated  # type: ignore[return-value]

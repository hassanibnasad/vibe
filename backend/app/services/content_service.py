from uuid import UUID

import structlog

from app.agents.content_generator import ContentGeneratorAgent
from app.exceptions import PostNotFoundError
from app.models.post import Post
from app.repositories.post_repo import PostRepository

logger = structlog.get_logger()


class ContentService:
    """Business logic service for AI content generation and post lifecycle."""

    def __init__(
        self,
        post_repo: PostRepository,
        agent: ContentGeneratorAgent | None = None,
    ):
        self.post_repo = post_repo
        self.agent = agent or ContentGeneratorAgent()

    async def generate_and_save_draft(
        self,
        brief: str,
        platform_id: UUID,
        platform_type: str = "linkedin",
        tone: str = "professional",
        campaign_id: UUID | None = None,
        campaign_context: str | None = None,
    ) -> Post:
        logger.info("content_service_generate_draft", platform=platform_type, tone=tone)

        agent_result = await self.agent.generate_post(
            brief=brief,
            platform=platform_type,
            tone=tone,
            campaign_context=campaign_context,
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
            status="draft",
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
            },
        )

        logger.info(
            "draft_post_created",
            post_id=str(post.id),
            confidence=post.confidence_score,
            requires_review=post.requires_review,
        )
        return post

    async def approve_post(self, post_id: UUID) -> Post:
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError(f"Post {post_id} not found")

        updated = await self.post_repo.update(
            post_id,
            status="approved",
            requires_review=False,
        )
        logger.info("post_approved", post_id=str(post_id))
        return updated  # type: ignore[return-value]

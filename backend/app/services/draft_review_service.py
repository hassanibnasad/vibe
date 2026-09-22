"""Persisted Draft revisions and explicit Operator approval."""

from __future__ import annotations

from uuid import UUID

from app.agents.content_generator import ContentGeneratorAgent
from app.exceptions import NotFoundError, ValidationError
from app.models.enums import PostStatus
from app.models.post import Post
from app.models.post_revision import PostRevision
from app.repositories.post_repo import PostRepository
from app.repositories.post_revision_repo import PostRevisionRepository


class DraftReviewService:
    """Owns feedback, copy revisions, and the Draft-to-Approved state transition."""

    def __init__(
        self,
        post_repo: PostRepository,
        revision_repo: PostRevisionRepository,
        generator: ContentGeneratorAgent | None = None,
    ) -> None:
        self._posts = post_repo
        self._revisions = revision_repo
        self._generator = generator or ContentGeneratorAgent()

    async def _post(self, post_id: UUID, tenant_id: UUID) -> Post:
        post = await self._posts.get_by_id(post_id)
        if post is None or post.tenant_id != tenant_id:
            raise NotFoundError("Post not found.")
        if post.status in {PostStatus.PUBLISHED.value, PostStatus.PUBLISHING.value}:
            raise ValidationError("Published content cannot be revised.")
        return post

    async def _snapshot(
        self,
        post: Post,
        *,
        source: str,
        operator_id: UUID,
        feedback: str | None = None,
        parent_revision_id: UUID | None = None,
        content: str | None = None,
        hashtags: list[str] | None = None,
        cta: str | None = None,
    ) -> PostRevision:
        revision = await self._revisions.create(
            tenant_id=post.tenant_id,
            post_id=post.id,
            revision_number=await self._revisions.next_number(post.id),
            content=content if content is not None else post.content,
            hashtags=hashtags if hashtags is not None else (post.hashtags or []),
            cta=cta if cta is not None else post.cta,
            feedback=feedback,
            source=source,
            created_by=operator_id,
            parent_revision_id=parent_revision_id or post.current_revision_id,
        )
        return revision

    async def edit(
        self,
        *,
        post_id: UUID,
        tenant_id: UUID,
        operator_id: UUID,
        content: str,
        hashtags: list[str] | None = None,
        cta: str | None = None,
        feedback: str | None = None,
    ) -> Post:
        post = await self._post(post_id, tenant_id)
        revision = await self._snapshot(
            post,
            source="operator_edit",
            operator_id=operator_id,
            feedback=feedback,
            content=content,
            hashtags=hashtags,
            cta=cta,
        )
        return await self._posts.update(
            post.id,
            content=revision.content,
            hashtags=revision.hashtags,
            cta=revision.cta,
            current_revision_id=revision.id,
            status=PostStatus.DRAFT.value,
            requires_review=True,
        )

    async def refine(
        self,
        *,
        post_id: UUID,
        tenant_id: UUID,
        operator_id: UUID,
        feedback: str,
    ) -> Post:
        post = await self._post(post_id, tenant_id)
        if not feedback.strip():
            raise ValidationError("Feedback is required to refine a Draft.")
        prompt = (
            f"{post.generation_prompt or 'Improve this LinkedIn draft.'}\n\n"
            f"Current draft:\n{post.content}\n\n"
            f"Operator feedback:\n{feedback}\n\n"
            "Return a revised post that applies the feedback while preserving verified brand claims."
        )
        generated = await self._generator.generate_post(
            brief=prompt,
            platform="linkedin",
            tone=str((post.metadata_ or {}).get("tone", "professional")),
            tenant_id=tenant_id,
        )
        if not generated.success:
            raise ValidationError("The Draft could not be refined; try editing it manually.")
        revision = await self._snapshot(
            post,
            source="feedback_refinement",
            operator_id=operator_id,
            feedback=feedback,
            content=generated.data.get("content", post.content),
            hashtags=generated.data.get("hashtags", post.hashtags or []),
            cta=generated.data.get("cta", post.cta),
        )
        return await self._posts.update(
            post.id,
            content=revision.content,
            hashtags=revision.hashtags,
            cta=revision.cta,
            current_revision_id=revision.id,
            status=PostStatus.DRAFT.value,
            requires_review=True,
        )

    async def approve(
        self, *, post_id: UUID, tenant_id: UUID, operator_id: UUID
    ) -> Post:
        post = await self._post(post_id, tenant_id)
        revision_id = post.current_revision_id
        if revision_id is None:
            revision = await self._snapshot(post, source="initial_snapshot", operator_id=operator_id)
            revision_id = revision.id
        return await self._posts.update(
            post.id,
            status=PostStatus.APPROVED.value,
            requires_review=False,
            approved_by=operator_id,
            approved_revision_id=revision_id,
            current_revision_id=revision_id,
        )

    async def list_revisions(self, post_id: UUID, tenant_id: UUID) -> list[PostRevision]:
        await self._post(post_id, tenant_id)
        return await self._revisions.list_for_post(post_id)


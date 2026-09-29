"""Idempotent dispatch of an approved Draft through a selected social connection."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from uuid import UUID

from app.exceptions import NotFoundError, ValidationError
from app.models.enums import PostStatus
from app.models.post import Post
from app.repositories.post_repo import PostRepository
from app.repositories.publication_attempt_repo import PublicationAttemptRepository
from app.services.linkedin_connection_service import LinkedInConnectionService
from app.tools.platform.linkedin_tool import LinkedInTool


class PublicationService:
    """Owns publish state transitions, connection ownership, and retry idempotency."""

    def __init__(
        self,
        post_repo: PostRepository,
        attempts: PublicationAttemptRepository,
        connections: LinkedInConnectionService,
    ) -> None:
        self._posts = post_repo
        self._attempts = attempts
        self._connections = connections

    @staticmethod
    def _idempotency_key(post: Post, connection_id: UUID) -> str:
        revision = post.approved_revision_id or post.current_revision_id or post.id
        payload = f"{post.id}:{connection_id}:{revision}".encode()
        return hashlib.sha256(payload).hexdigest()

    async def publish(
        self,
        *,
        post_id: UUID,
        connection_id: UUID,
        tenant_id: UUID,
        operator_id: UUID,
    ) -> Post:
        post = await self._posts.get_by_id(post_id)
        if post is None or post.tenant_id != tenant_id:
            raise NotFoundError("Post not found.")

        if post.status == PostStatus.PUBLISHED.value:
            if post.social_connection_id == connection_id:
                return post
            raise ValidationError("Published posts cannot be sent through a different connection.")

        if post.status != PostStatus.APPROVED.value:
            raise ValidationError("Only an approved Draft can be published.")

        connection = await self._connections.get_publishable_connection(
            connection_id, tenant_id, operator_id
        )
        attempt = await self._attempts.get_for_post_and_connection(post.id, connection.id)
        if attempt and attempt.status == "succeeded":
            return post
        if attempt and attempt.status == "dispatching":
            raise ValidationError("This publication is already being dispatched.")

        if attempt is None:
            attempt = await self._attempts.create(
                tenant_id=tenant_id,
                post_id=post.id,
                revision_id=post.approved_revision_id or post.current_revision_id,
                connection_id=connection.id,
                idempotency_key=self._idempotency_key(post, connection.id),
                status="dispatching",
            )
        else:
            attempt = await self._attempts.update(attempt.id, status="dispatching", error_message=None)

        await self._posts.update(
            post.id,
            status=PostStatus.PUBLISHING.value,
            social_connection_id=connection.id,
            error_message=None,
        )

        tool = LinkedInTool(
            access_token=self._connections.decrypt_access_token(connection),
            author_urn=connection.author_urn,
        )
        result = await tool.publish_post(
            content=post.content,
            media_urls=post.media_urls or [],
            hashtags=post.hashtags or [],
            cta=post.cta,
        )

        if not result.success:
            err = getattr(result, "error_message", None) or "LinkedIn publishing failed."
            await self._attempts.update(
                attempt.id,
                status="failed",
                error_message=err,
                completed_at=datetime.now(UTC),
            )
            return await self._posts.update(
                post.id,
                status=PostStatus.FAILED.value,
                error_message=err,
                retry_count=post.retry_count + 1,
            )

        post_id_val = result.platform_post_id
        post_url_val = result.platform_post_url
        await self._attempts.update(
            attempt.id,
            status="succeeded",
            platform_post_id=post_id_val,
            platform_post_url=post_url_val,
            dispatched_at=datetime.now(UTC),
            completed_at=datetime.now(UTC),
            metadata_=getattr(result, "metadata_", {}) or {},
        )
        return await self._posts.update(
            post.id,
            status=PostStatus.PUBLISHED.value,
            published_at=datetime.now(UTC),
            platform_post_id=post_id_val,
            platform_post_url=post_url_val,
            error_message=None,
        )


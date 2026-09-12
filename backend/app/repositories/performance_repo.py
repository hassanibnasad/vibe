from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content_performance import ContentPerformance
from app.repositories.base import BaseRepository


class PerformanceRepository(BaseRepository[ContentPerformance]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ContentPerformance)

    async def get_by_post(self, post_id: UUID) -> ContentPerformance | None:
        """Return the performance record for a specific post."""
        stmt = (
            select(ContentPerformance)
            .where(ContentPerformance.post_id == post_id)
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_metrics(self, post_id: UUID, tenant_id: UUID, **metrics: Any) -> ContentPerformance:
        """Insert or update engagement metrics for a post.

        Recalculates ``conversion_score`` on every upsert.
        """
        existing = await self.get_by_post(post_id)

        if existing is not None:
            for key, value in metrics.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            existing.conversion_score = self._compute_score(existing)
            existing.scored_at = datetime.now(UTC)
            await self.session.flush()
            return existing

        perf = ContentPerformance(post_id=post_id, tenant_id=tenant_id, **metrics)
        perf.conversion_score = self._compute_score(perf)
        perf.scored_at = datetime.now(UTC)
        self.session.add(perf)
        await self.session.flush()
        return perf

    async def get_top_performers(
        self,
        tenant_id: UUID,
        limit: int = 10,
        since: timedelta | None = None,
        platform: str | None = None,
    ) -> list[ContentPerformance]:
        """Return the top N posts by conversion_score for a tenant."""
        stmt = (
            select(ContentPerformance)
            .where(ContentPerformance.tenant_id == tenant_id)
            .order_by(ContentPerformance.conversion_score.desc())
            .limit(limit)
        )
        if since is not None:
            cutoff = datetime.now(UTC) - since
            stmt = stmt.where(ContentPerformance.scored_at >= cutoff)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_bottom_performers(
        self,
        tenant_id: UUID,
        limit: int = 10,
        since: timedelta | None = None,
    ) -> list[ContentPerformance]:
        """Return the bottom N posts by conversion_score for a tenant."""
        stmt = (
            select(ContentPerformance)
            .where(
                ContentPerformance.tenant_id == tenant_id,
                ContentPerformance.conversion_score > 0,  # exclude unscored
            )
            .order_by(ContentPerformance.conversion_score.asc())
            .limit(limit)
        )
        if since is not None:
            cutoff = datetime.now(UTC) - since
            stmt = stmt.where(ContentPerformance.scored_at >= cutoff)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    def _compute_score(perf: ContentPerformance) -> float:
        """Composite conversion score formula.

        Weights are tuned for B2B SaaS marketing where a qualified lead
        is worth orders of magnitude more than a passive impression.
        """
        return round(
            ((perf.impressions or 0) * 0.1)
            + ((perf.comments or 0) * 0.5)
            + ((perf.shares or 0) * 1.0)
            + ((perf.dms_initiated or 0) * 2.0)
            + ((perf.leads_qualified or 0) * 10.0),
            2,
        )

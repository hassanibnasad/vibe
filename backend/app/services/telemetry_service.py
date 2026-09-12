"""
TelemetryService — collect engagement metrics from platform APIs and
compute conversion scores for the closed-loop feedback pipeline.

Pulls metrics from social platform APIs (LinkedIn, X, etc.) for published
posts and persists them into ``content_performance``.  Also syncs the
denormalized ``posts.conversion_score`` column.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

import structlog

from app.repositories.lead_repo import LeadRepository
from app.repositories.performance_repo import PerformanceRepository
from app.repositories.post_repo import PostRepository

logger = structlog.get_logger()


class TelemetryService:
    """Collect engagement metrics and compute conversion scores."""

    def __init__(
        self,
        post_repo: PostRepository,
        performance_repo: PerformanceRepository,
        lead_repo: LeadRepository | None = None,
    ) -> None:
        self._posts = post_repo
        self._perf = performance_repo
        self._leads = lead_repo or LeadRepository(post_repo.session)

    async def sync_post_metrics(self, post_id: UUID, tenant_id: UUID) -> dict:
        """Sync engagement metrics for a single published post.

        1. Read current engagement_metrics JSONB from the post
        2. Count leads and qualified leads via LeadRepository
        3. Upsert into content_performance
        4. Mirror conversion_score back to posts table via PostRepository

        Returns a summary dict.
        """
        post = await self._posts.get_by_id(post_id)
        if post is None or post.status != "published":
            return {"status": "skipped", "reason": "post not found or not published"}

        # Read platform metrics from the post's engagement_metrics JSONB
        metrics = post.engagement_metrics or {}

        # Count leads attributed to this post via LeadRepository
        leads_generated, leads_qualified = await self._leads.get_post_lead_counts(post_id)

        # Upsert into content_performance
        perf = await self._perf.upsert_metrics(
            post_id=post_id,
            tenant_id=tenant_id,
            impressions=metrics.get("impressions", 0),
            likes=metrics.get("likes", 0),
            comments=metrics.get("comments", 0),
            shares=metrics.get("shares", 0),
            dms_initiated=metrics.get("dms_initiated", 0),
            leads_generated=leads_generated,
            leads_qualified=leads_qualified,
        )

        # Mirror conversion_score back to the posts table via PostRepository
        await self._posts.update_conversion_score(post_id, perf.conversion_score)

        logger.info(
            "telemetry.post_synced",
            post_id=str(post_id),
            conversion_score=perf.conversion_score,
            leads_generated=leads_generated,
            leads_qualified=leads_qualified,
        )

        return {
            "post_id": str(post_id),
            "conversion_score": perf.conversion_score,
            "leads_generated": leads_generated,
            "leads_qualified": leads_qualified,
        }

    async def sync_all_recent(
        self, tenant_id: UUID, since_days: int = 7
    ) -> int:
        """Batch sync metrics for all posts published in the last N days.

        Returns the number of posts synced.
        """
        cutoff = datetime.now(UTC) - timedelta(days=since_days)
        post_ids = await self._posts.get_recent_published_ids(tenant_id, cutoff)

        synced = 0
        for post_id in post_ids:
            try:
                await self.sync_post_metrics(post_id, tenant_id)
                synced += 1
            except Exception as exc:
                logger.error(
                    "telemetry.sync_failed",
                    post_id=str(post_id),
                    error=str(exc),
                )

        logger.info(
            "telemetry.batch_sync_complete",
            tenant_id=str(tenant_id),
            total_posts=len(post_ids),
            synced=synced,
        )
        return synced

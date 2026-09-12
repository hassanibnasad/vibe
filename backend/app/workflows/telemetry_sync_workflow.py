"""
Telemetry Sync Hatchet workflows.

1. ``telemetry_sync_cron_workflow`` — a cron-triggered workflow (runs daily at 3:00 AM UTC)
   that syncs engagement metrics and updates conversion scores for published posts.
2. ``telemetry_sync_task`` — an on-demand task to sync metrics for a specific tenant or post.
"""

from __future__ import annotations

import datetime
from uuid import UUID

import structlog
from hatchet_sdk import Context, EmptyModel
from pydantic import BaseModel

from app.hatchet_client import hatchet

logger = structlog.get_logger()


# ──────────────────────────────────────────────────────────────────────────────
# 1. Cron workflow — daily sync at 03:00 UTC
# ──────────────────────────────────────────────────────────────────────────────

telemetry_sync_cron_workflow = hatchet.workflow(
    name="TelemetrySyncCron",
    on_crons=["0 3 * * *"],
)


@telemetry_sync_cron_workflow.task(
    execution_timeout=datetime.timedelta(minutes=10),
)
async def daily_telemetry_sync_task(input: EmptyModel, ctx: Context) -> dict:
    """Cron-triggered task: sync engagement metrics across all active tenants."""
    from app.dependencies import get_sessionmaker  # noqa: PLC0415
    from app.repositories.performance_repo import PerformanceRepository  # noqa: PLC0415
    from app.repositories.post_repo import PostRepository  # noqa: PLC0415
    from app.services.telemetry_service import TelemetryService  # noqa: PLC0415

    session_factory = get_sessionmaker()
    async with session_factory() as session:
        post_repo = PostRepository(session)
        perf_repo = PerformanceRepository(session)
        telemetry_service = TelemetryService(post_repo=post_repo, performance_repo=perf_repo)

        # Find all distinct tenant_ids with published posts via repository
        tenant_ids = await post_repo.get_all_published_tenant_ids()

        synced_counts = {}
        for t_id in tenant_ids:
            try:
                from sqlalchemy import text  # noqa: PLC0415
                if session.bind and session.bind.dialect.name == "postgresql":
                    await session.execute(
                        text("SELECT set_config('app.current_tenant', :tenant, true)"),
                        {"tenant": str(t_id)},
                    )
                count = await telemetry_service.sync_all_recent(t_id, since_days=7)
                synced_counts[str(t_id)] = count
            except Exception as exc:
                logger.error("daily_telemetry_sync.tenant_error", tenant_id=str(t_id), error=str(exc))

        await session.commit()

    logger.info("daily_telemetry_sync_completed", tenants_count=len(tenant_ids), synced_counts=synced_counts)
    return {
        "status": "success",
        "tenants_count": len(tenant_ids),
        "synced_counts": synced_counts,
    }


# ──────────────────────────────────────────────────────────────────────────────
# 2. On-demand standalone task — sync metrics for a specific tenant or post
# ──────────────────────────────────────────────────────────────────────────────


class TelemetrySyncInput(BaseModel):
    """Input schema for on-demand telemetry sync."""

    tenant_id: str
    post_id: str | None = None
    since_days: int = 7


@hatchet.task(
    name="sync-telemetry",
    input_validator=TelemetrySyncInput,
    retries=2,
    execution_timeout=datetime.timedelta(minutes=5),
)
async def telemetry_sync_task(
    input: TelemetrySyncInput,
    ctx: Context,
) -> dict:
    """On-demand task: sync metrics for a specific tenant or single post."""
    from app.dependencies import get_sessionmaker  # noqa: PLC0415
    from app.repositories.performance_repo import PerformanceRepository  # noqa: PLC0415
    from app.repositories.post_repo import PostRepository  # noqa: PLC0415
    from app.services.telemetry_service import TelemetryService  # noqa: PLC0415

    tenant_id = UUID(input.tenant_id)
    session_factory = get_sessionmaker()

    async with session_factory() as session:
        post_repo = PostRepository(session)
        perf_repo = PerformanceRepository(session)
        telemetry_service = TelemetryService(post_repo=post_repo, performance_repo=perf_repo)

        if input.post_id:
            post_id = UUID(input.post_id)
            result = await telemetry_service.sync_post_metrics(post_id=post_id, tenant_id=tenant_id)
            await session.commit()
            return {"status": "success", "synced_post": result}

        synced = await telemetry_service.sync_all_recent(tenant_id=tenant_id, since_days=input.since_days)
        await session.commit()
        return {"status": "success", "synced_posts_count": synced}

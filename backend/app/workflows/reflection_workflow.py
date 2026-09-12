"""
Reflection Hatchet workflows.

1. ``weekly_reflection_cron_workflow`` — runs weekly (Sunday 2:00 AM UTC) to analyze
   post conversion performance across all tenants and update brand playbooks.
2. ``reflection_task`` — on-demand standalone task to trigger reflection for a specific tenant.
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
# 1. Cron workflow — weekly Sunday at 02:00 UTC
# ──────────────────────────────────────────────────────────────────────────────

weekly_reflection_cron_workflow = hatchet.workflow(
    name="WeeklyReflectionCron",
    on_crons=["0 2 * * 0"],
)


@weekly_reflection_cron_workflow.task(
    execution_timeout=datetime.timedelta(minutes=15),
)
async def weekly_reflection_task(input: EmptyModel, ctx: Context) -> dict:
    """Cron-triggered task: sync telemetry and run reflection for all active tenants."""
    from app.agents.reflection_agent import ReflectionAgent  # noqa: PLC0415
    from app.dependencies import get_sessionmaker  # noqa: PLC0415
    from app.repositories.brand_profile_repo import BrandProfileRepository  # noqa: PLC0415
    from app.repositories.performance_repo import PerformanceRepository  # noqa: PLC0415
    from app.repositories.post_repo import PostRepository  # noqa: PLC0415
    from app.services.telemetry_service import TelemetryService  # noqa: PLC0415

    session_factory = get_sessionmaker()
    results = {}

    async with session_factory() as session:
        post_repo = PostRepository(session)
        perf_repo = PerformanceRepository(session)
        bp_repo = BrandProfileRepository(session)
        telemetry_service = TelemetryService(post_repo=post_repo, performance_repo=perf_repo)
        agent = ReflectionAgent(
            post_repo=post_repo,
            performance_repo=perf_repo,
            brand_profile_repo=bp_repo,
        )

        # Find all tenants with complete brand profiles via repository
        tenant_ids = await bp_repo.get_active_tenant_ids()

        for t_id in tenant_ids:
            try:
                from sqlalchemy import text  # noqa: PLC0415
                if session.bind and session.bind.dialect.name == "postgresql":
                    await session.execute(
                        text("SELECT set_config('app.current_tenant', :tenant, true)"),
                        {"tenant": str(t_id)},
                    )

                # 1. Sync telemetry for the last 30 days
                await telemetry_service.sync_all_recent(t_id, since_days=30)

                # 2. Run reflection
                result = await agent.reflect(tenant_id=t_id, since_days=30)
                await session.commit()
                results[str(t_id)] = {
                    "success": result.success,
                    "confidence": result.confidence_score,
                    "summary": result.data.get("summary", ""),
                }
            except Exception as exc:
                logger.error("weekly_reflection.tenant_error", tenant_id=str(t_id), error=str(exc))
                results[str(t_id)] = {"success": False, "error": str(exc)}

    logger.info("weekly_reflection_cron_completed", tenants_count=len(tenant_ids))
    return {
        "status": "success",
        "tenants_count": len(tenant_ids),
        "results": results,
    }


# ──────────────────────────────────────────────────────────────────────────────
# 2. On-demand standalone task — trigger reflection for a single tenant
# ──────────────────────────────────────────────────────────────────────────────


class ReflectionTaskInput(BaseModel):
    """Input schema for on-demand reflection task."""

    tenant_id: str
    since_days: int = 30


@hatchet.task(
    name="run-reflection",
    input_validator=ReflectionTaskInput,
    retries=1,
    execution_timeout=datetime.timedelta(minutes=5),
)
async def run_reflection_task(
    input: ReflectionTaskInput,
    ctx: Context,
) -> dict:
    """On-demand task: sync telemetry and run reflection for a single tenant."""
    from app.agents.reflection_agent import ReflectionAgent  # noqa: PLC0415
    from app.dependencies import get_sessionmaker  # noqa: PLC0415
    from app.repositories.brand_profile_repo import BrandProfileRepository  # noqa: PLC0415
    from app.repositories.performance_repo import PerformanceRepository  # noqa: PLC0415
    from app.repositories.post_repo import PostRepository  # noqa: PLC0415
    from app.services.telemetry_service import TelemetryService  # noqa: PLC0415

    tenant_id = UUID(input.tenant_id)
    session_factory = get_sessionmaker()

    async with session_factory() as session:
        from sqlalchemy import text  # noqa: PLC0415
        if session.bind and session.bind.dialect.name == "postgresql":
            await session.execute(
                text("SELECT set_config('app.current_tenant', :tenant, true)"),
                {"tenant": str(tenant_id)},
            )

        post_repo = PostRepository(session)
        perf_repo = PerformanceRepository(session)
        bp_repo = BrandProfileRepository(session)

        # 1. Sync telemetry
        telemetry_service = TelemetryService(post_repo=post_repo, performance_repo=perf_repo)
        await telemetry_service.sync_all_recent(tenant_id, since_days=input.since_days)

        # 2. Run reflection
        agent = ReflectionAgent(
            post_repo=post_repo,
            performance_repo=perf_repo,
            brand_profile_repo=bp_repo,
        )
        result = await agent.reflect(tenant_id=tenant_id, since_days=input.since_days)
        await session.commit()

    return {
        "status": "success" if result.success else "failed",
        "data": result.data,
        "reasoning": result.reasoning,
    }

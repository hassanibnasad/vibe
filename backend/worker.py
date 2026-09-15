"""
VibeAgent Hatchet Worker

This is the long-running worker process that registers all Hatchet tasks and
begins polling the Hatchet engine for work. Run this as a separate process
alongside the FastAPI app:

    python worker.py

Environment variables required (set in .env or Docker environment):
    HATCHET_CLIENT_TOKEN  — API token from the Hatchet dashboard / cloud.hatchet.run
    HATCHET_HOST          — gRPC host:port (omit for Hatchet Cloud, e.g. "localhost:7077" for self-hosted)

Workers are kept separate from the FastAPI process so that:
  - Heavy background jobs (LLM calls, platform API calls) don't block HTTP request handling.
  - Workers can be scaled horizontally independently of the API tier.
  - Hatchet retries and timeouts apply cleanly without FastAPI lifecycle interference.
"""

import structlog

from app.hatchet_client import hatchet
from app.log_config import configure_logging

# Import all Hatchet workflow / task objects so the worker knows what to register.
from app.workflows.content_workflow import content_pipeline_task
from app.workflows.engagement_workflow import engagement_pipeline_task
from app.workflows.ingestion_workflow import knowledge_ingestion_task
from app.workflows.onboarding_workflow import tenant_onboarding_task
from app.workflows.reflection_workflow import (
    run_reflection_task,
    weekly_reflection_cron_workflow,
)
from app.workflows.scheduled_publish import (
    publish_single_post_task,
    scheduled_publish_cron_workflow,
)
from app.workflows.telemetry_sync_workflow import (
    telemetry_sync_cron_workflow,
    telemetry_sync_task,
)

logger = structlog.get_logger()


def main() -> None:
    configure_logging()
    logger.info("starting_hatchet_worker", service="vibeagent-worker")

    worker = hatchet.worker(
        "vibeagent-worker",
        # Register all workflows / standalone tasks.
        # Cron workflows register their own cron schedule with Hatchet when the worker starts.
        workflows=[
            content_pipeline_task,            # standalone task → Hatchet wraps it internally
            engagement_pipeline_task,         # standalone task
            knowledge_ingestion_task,         # standalone task — chunk/embed/upsert in background
            tenant_onboarding_task,            # standalone task — website scrape + brand synthesis
            scheduled_publish_cron_workflow,  # cron workflow (runs every minute)
            publish_single_post_task,         # standalone task
            telemetry_sync_cron_workflow,     # cron workflow (runs daily at 3:00 AM UTC)
            telemetry_sync_task,              # standalone task (on-demand telemetry sync)
            weekly_reflection_cron_workflow,  # cron workflow (runs weekly Sunday 2:00 AM UTC)
            run_reflection_task,              # standalone task (on-demand reflection analysis)
        ],
        # Allow up to 20 concurrent task slots per worker instance.
        # Adjust based on available CPU / memory; LLM-heavy tasks can each be
        # slow so keep this conservative to avoid starving other tasks.
        slots=20,
    )

    worker.start()


if __name__ == "__main__":
    main()

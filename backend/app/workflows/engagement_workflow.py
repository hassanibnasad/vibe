"""
Engagement pipeline Hatchet task.

Replaces the former plain async function with a proper @hatchet.task so that
inbound social touchpoints are processed durably with retries, observability,
and distributed worker execution as defined in CONTEXT.md.
"""

import datetime
from typing import Any

import structlog
from hatchet_sdk import Context
from pydantic import BaseModel

from app.hatchet_client import hatchet

logger = structlog.get_logger()


class EngagementInput(BaseModel):
    """Input schema for the engagement-pipeline task."""

    platform: str
    raw_payload: dict[str, Any]


@hatchet.task(
    name="engagement-pipeline",
    input_validator=EngagementInput,
    retries=3,
    execution_timeout=datetime.timedelta(minutes=2),
)
async def engagement_pipeline_task(
    input: EngagementInput,
    ctx: Context,
) -> dict[str, Any]:
    """Asynchronous worker pipeline for ingesting inbound social touchpoints and replying."""
    from app.dependencies import get_sessionmaker  # noqa: PLC0415
    from app.repositories.conversation_repo import ConversationRepository  # noqa: PLC0415
    from app.repositories.lead_repo import LeadRepository  # noqa: PLC0415
    from app.repositories.message_repo import MessageRepository  # noqa: PLC0415
    from app.services.engagement_service import EngagementService  # noqa: PLC0415
    from app.tools.platform.registry import PlatformRegistry  # noqa: PLC0415

    session_factory = get_sessionmaker()
    async with session_factory() as session:
        lead_repo = LeadRepository(session)
        conv_repo = ConversationRepository(session)
        msg_repo = MessageRepository(session)

        registry = PlatformRegistry()
        engagement_service = EngagementService(
            lead_repo=lead_repo,
            conv_repo=conv_repo,
            msg_repo=msg_repo,
            platform_registry=registry,
        )

        result = await engagement_service.ingest_event(
            platform=input.platform,
            raw_payload=input.raw_payload,
        )
        await session.commit()

    logger.info("engagement_pipeline_completed", platform=input.platform, result_keys=list(result.keys()))
    return result

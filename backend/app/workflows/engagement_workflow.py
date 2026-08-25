from typing import Any
import structlog

from app.dependencies import get_sessionmaker
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.services.engagement_service import EngagementService
from app.tools.ai.llm_client import LLMClient
from app.tools.platform.base import BasePlatformTool
from app.tools.platform.registry import PlatformRegistry

logger = structlog.get_logger()


async def process_inbound_engagement(
    platform: str,
    raw_payload: dict[str, Any],
    llm_client: LLMClient | None = None,
    platform_tool: BasePlatformTool | None = None,
) -> dict[str, Any]:
    """Asynchronous worker pipeline for ingesting inbound social touchpoints and replying."""
    session_factory = get_sessionmaker()
    async with session_factory() as session:
        lead_repo = LeadRepository(session)
        conv_repo = ConversationRepository(session)
        msg_repo = MessageRepository(session)

        registry = PlatformRegistry()
        if platform_tool:
            registry.register(platform, platform_tool)

        engagement_service = EngagementService(
            lead_repo=lead_repo,
            conv_repo=conv_repo,
            msg_repo=msg_repo,
            platform_registry=registry,
        )

        result = await engagement_service.ingest_event(platform=platform, raw_payload=raw_payload)
        await session.commit()
        return result

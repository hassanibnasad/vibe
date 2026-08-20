from typing import Any
import structlog

from app.agents.monitor import MonitorAgent
from app.agents.reply_agent import ReplyAgent
from app.dependencies import get_sessionmaker
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.tools.ai.llm_client import LLMClient
from app.tools.ai.sentiment_tool import SentimentTool
from app.tools.platform.linkedin_tool import LinkedInTool
from app.tools.utils.event_normalizer import EventNormalizer, NormalizedEvent

logger = structlog.get_logger()


async def process_inbound_engagement(
    platform: str,
    raw_payload: dict[str, Any],
    llm_client: LLMClient | None = None,
    linkedin_tool: LinkedInTool | None = None,
) -> dict[str, Any]:
    """Complete asynchronous pipeline for ingesting inbound social touchpoints and replying."""
    event: NormalizedEvent = EventNormalizer.normalize(platform, raw_payload)
    llm = llm_client or LLMClient()
    platform_tool = linkedin_tool or LinkedInTool()

    session_factory = get_sessionmaker()
    async with session_factory() as session:
        lead_repo = LeadRepository(session)
        conv_repo = ConversationRepository(session)
        msg_repo = MessageRepository(session)
        sentiment_tool = SentimentTool(llm_client=llm)

        # 1. Monitor & Ingest Event
        monitor_agent = MonitorAgent(
            lead_repo=lead_repo,
            conversation_repo=conv_repo,
            message_repo=msg_repo,
            sentiment_tool=sentiment_tool,
        )
        monitor_res = await monitor_agent.process_event(event)

        if not monitor_res.success:
            return {"status": "error", "message": "Failed to process event"}

        lead_id = monitor_res.data["lead_id"]
        conv_id = monitor_res.data["conversation_id"]
        requires_reply = monitor_res.data.get("requires_reply", False)
        sentiment = monitor_res.data.get("sentiment", "neutral")

        reply_info: dict[str, Any] = {"generated": False}

        # 2. AI Reply Generation
        if requires_reply:
            reply_agent = ReplyAgent(
                message_repo=msg_repo,
                llm_client=llm,
            )
            reply_res = await reply_agent.generate_reply(
                conversation_id=conv_repo.model.id.__class__(conv_id),
                incoming_message=event.content,
                platform=platform,
                lead_name=event.author_name,
                lead_company=event.author_headline,
                sentiment=sentiment,
            )

            reply_info = {
                "generated": True,
                "message_id": reply_res.data["message_id"],
                "requires_review": reply_res.requires_review,
                "confidence_score": reply_res.confidence_score,
                "reply_text": reply_res.data["reply_text"],
            }

            # 3. Auto-dispatch if high confidence
            if not reply_res.requires_review:
                try:
                    dispatch_res = await platform_tool.send_reply(
                        thread_id=event.thread_id,
                        content=reply_res.data["reply_text"],
                        parent_comment_id=event.parent_id,
                    )
                    reply_info["dispatched"] = dispatch_res.success
                    reply_info["platform_message_id"] = dispatch_res.platform_message_id
                except Exception as exc:
                    logger.error("auto_dispatch_failed", error=str(exc))
                    reply_info["dispatch_error"] = str(exc)

        await session.commit()
        return {
            "status": "success",
            "lead_id": lead_id,
            "conversation_id": conv_id,
            "reply": reply_info,
        }

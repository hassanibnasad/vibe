from datetime import UTC, datetime

import structlog

from app.agents.base import AgentResult, BaseAgent
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.tools.ai.sentiment_tool import SentimentTool
from app.tools.utils.event_normalizer import NormalizedEvent

logger = structlog.get_logger()


class MonitorAgent(BaseAgent):
    """Monitors, ingests, and normalizes inbound platform interactions into Leads, Threads, and Messages."""

    def __init__(
        self,
        lead_repo: LeadRepository,
        conversation_repo: ConversationRepository,
        message_repo: MessageRepository,
        sentiment_tool: SentimentTool | None = None,
        confidence_threshold: float = 0.85,
    ):
        super().__init__(name="MonitorAgent", confidence_threshold=confidence_threshold)
        self.lead_repo = lead_repo
        self.conversation_repo = conversation_repo
        self.message_repo = message_repo
        self.sentiment_tool = sentiment_tool

    async def process_event(self, event: NormalizedEvent) -> AgentResult:
        self.logger.info(
            "monitor_processing_event",
            platform=event.platform,
            type=event.event_type,
            author=event.author_id,
        )

        now = datetime.now(UTC)

        # 1. Upsert Lead
        lead = await self.lead_repo.upsert_from_interaction(
            platform=event.platform,
            platform_user_id=event.author_id,
            name=event.author_name,
            job_title=event.author_headline,
            last_interaction_at=now,
        )

        # Increment lead interactions count
        current_interactions = (lead.metadata_ or {}).get("interaction_count", 0) + 1
        lead.metadata_ = {**(lead.metadata_ or {}), "interaction_count": current_interactions}

        # 2. Get or create Conversation
        conv = await self.conversation_repo.get_by_lead_and_thread(
            lead_id=lead.id,
            platform_thread_id=event.thread_id,
        )
        if not conv:
            conv = await self.conversation_repo.create(
                lead_id=lead.id,
                platform_thread_id=event.thread_id,
                status="active",
                last_message_at=now,
                context={"platform": event.platform, "channel": event.event_type, "initial_event_id": event.event_id},
            )
        else:
            await self.conversation_repo.update(
                conv.id,
                last_message_at=now,
                status="active",
            )

        # 3. Sentiment analysis on incoming content
        sentiment_label = "neutral"
        sentiment_score = 0.0
        if self.sentiment_tool and event.content:
            try:
                sentiment_res = await self.sentiment_tool.analyze(event.content)
                sentiment_label = sentiment_res.label
                sentiment_score = sentiment_res.score
            except Exception as exc:
                self.logger.warning("sentiment_analysis_failed", error=str(exc))

        # 4. Record inbound message
        message = await self.message_repo.create(
            conversation_id=conv.id,
            direction="inbound",
            content=event.content,
            content_type="text",
            platform=event.platform,
            platform_message_id=event.event_id,
            sentiment=sentiment_label,
            sentiment_score=sentiment_score,
            requires_review=False,
        )

        # Determine if an AI reply is required
        # Comments and direct messages with text content warrant reply generation
        requires_reply = event.event_type in ("comment", "direct_message", "mention") and bool(event.content.strip())

        return AgentResult(
            success=True,
            confidence_score=1.0,
            requires_review=False,
            data={
                "lead_id": str(lead.id),
                "conversation_id": str(conv.id),
                "message_id": str(message.id),
                "platform": event.platform,
                "event_type": event.event_type,
                "sentiment": sentiment_label,
                "requires_reply": requires_reply,
            },
            reasoning=f"Successfully ingested {event.event_type} from {event.platform} for lead {lead.id}.",
        )

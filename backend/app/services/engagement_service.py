from typing import Any
from uuid import UUID

import structlog

from app.agents.monitor import MonitorAgent
from app.agents.reply_agent import ReplyAgent
from app.exceptions import ConversationNotFoundError, NotFoundError
from app.models.conversation import Conversation
from app.models.enums import MessageDirection, ReviewStatus
from app.models.message import Message
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.tools.ai.sentiment_tool import SentimentTool
from app.tools.platform.registry import PlatformRegistry, default_platform_registry
from app.tools.utils.event_normalizer import NormalizedEvent

logger = structlog.get_logger()


class EngagementService:
    """Deep domain service orchestrating omnichannel interactions, conversation threads, AI replies, and human review."""

    def __init__(
        self,
        lead_repo: LeadRepository,
        conv_repo: ConversationRepository,
        msg_repo: MessageRepository,
        monitor_agent: MonitorAgent | None = None,
        reply_agent: ReplyAgent | None = None,
        platform_registry: PlatformRegistry | None = None,
        sentiment_tool: SentimentTool | None = None,
    ):
        self.lead_repo = lead_repo
        self.conv_repo = conv_repo
        self.msg_repo = msg_repo
        self.platform_registry = platform_registry or default_platform_registry
        self.sentiment_tool = sentiment_tool or SentimentTool()
        self.monitor_agent = monitor_agent or MonitorAgent(
            lead_repo=lead_repo,
            conversation_repo=conv_repo,
            message_repo=msg_repo,
            sentiment_tool=self.sentiment_tool,
        )
        self.reply_agent = reply_agent or ReplyAgent(
            message_repo=msg_repo,
        )

    async def get_conversation(self, conversation_id: UUID) -> Conversation:
        conv = await self.conv_repo.get_by_id(conversation_id)
        if not conv:
            raise ConversationNotFoundError(f"Conversation {conversation_id} not found")
        return conv

    async def list_conversations(self, lead_id: UUID | None = None, limit: int = 50) -> list[Conversation]:
        if lead_id:
            return await self.conv_repo.get_active_by_lead(lead_id)
        return await self.conv_repo.get_all(limit=limit)

    async def get_messages(self, conversation_id: UUID, limit: int = 50) -> list[Message]:
        await self.get_conversation(conversation_id)
        return await self.msg_repo.get_messages_for_conversation(conversation_id, limit=limit)

    async def get_review_queue(self, limit: int = 50) -> list[Message]:
        return await self.msg_repo.get_review_queue(limit=limit)

    async def approve_reply(self, message_id: UUID) -> Message:
        """Approve a staged AI reply and dispatch to social platform."""
        message = await self.msg_repo.get_by_id(message_id)
        if not message:
            raise NotFoundError(f"Message {message_id} not found")

        updated = await self.msg_repo.update(
            message_id,
            review_status=ReviewStatus.APPROVED.value,
            requires_review=False,
        )

        # Dispatch to platform if conversation exists
        if message.conversation_id:
            conv = await self.conv_repo.get_by_id(message.conversation_id)
            if conv and conv.platform_thread_id:
                try:
                    tool = self.platform_registry.get(message.platform or "linkedin")
                    await tool.send_reply(
                        thread_id=conv.platform_thread_id,
                        content=message.content,
                    )
                    logger.info("approved_reply_dispatched", message_id=str(message_id))
                except Exception as exc:
                    logger.warning("approved_reply_dispatch_error", error=str(exc))

        return updated  # type: ignore[return-value]

    async def reject_or_edit_reply(
        self,
        message_id: UUID,
        alternative_reply: str | None = None,
    ) -> Message:
        """Reject an AI reply or replace it with edited operator content."""
        message = await self.msg_repo.get_by_id(message_id)
        if not message:
            raise NotFoundError(f"Message {message_id} not found")

        update_payload: dict[str, Any] = {
            "review_status": ReviewStatus.REJECTED.value,
            "requires_review": False,
        }
        if alternative_reply:
            update_payload["original_content"] = message.content
            update_payload["content"] = alternative_reply
            update_payload["review_status"] = ReviewStatus.EDITED.value

        updated = await self.msg_repo.update(message_id, **update_payload)
        logger.info("review_item_resolved", message_id=str(message_id), status=update_payload["review_status"])
        return updated  # type: ignore[return-value]

    async def send_manual_message(
        self,
        conversation_id: UUID,
        content: str,
        media_urls: list[str] | None = None,
    ) -> Message:
        """Record and dispatch an operator-authored manual response."""
        conv = await self.get_conversation(conversation_id)
        platform_name = conv.platform.name if conv.platform else "linkedin"

        message = await self.msg_repo.create(
            conversation_id=conversation_id,
            direction=MessageDirection.OUTBOUND.value,
            content=content,
            media_urls=media_urls or [],
            platform=platform_name,
            review_status=ReviewStatus.APPROVED.value,
            requires_review=False,
        )

        # Dispatch to platform connector
        try:
            tool = self.platform_registry.get(platform_name)
            if conv.platform_thread_id:
                await tool.send_reply(
                    thread_id=conv.platform_thread_id,
                    content=content,
                )
        except Exception as exc:
            logger.warning("manual_message_dispatch_error", error=str(exc))

        return message

    async def ingest_event(
        self,
        platform: str,
        raw_payload: dict[str, Any],
    ) -> dict[str, Any]:
        """Complete ingestion pipeline: normalize event via platform adapter, ingest thread, qualify lead, generate AI reply, auto-dispatch."""
        event: NormalizedEvent = self.platform_registry.normalize_event(platform, raw_payload)
        monitor_res = await self.monitor_agent.process_event(event)

        if not monitor_res.success:
            return {"status": "error", "message": "Failed to process event"}

        lead_id = monitor_res.data["lead_id"]
        conv_id = UUID(monitor_res.data["conversation_id"])
        requires_reply = monitor_res.data.get("requires_reply", False)
        sentiment = monitor_res.data.get("sentiment", "neutral")

        reply_info: dict[str, Any] = {"generated": False}

        if requires_reply:
            reply_res = await self.reply_agent.generate_reply(
                conversation_id=conv_id,
                incoming_message=event.content,
                platform=platform,
                lead_name=event.author_name,
                lead_company=event.author_headline,
                sentiment=sentiment,
            )

            reply_info = {
                "generated": True,
                "message_id": reply_res.data.get("message_id"),
                "requires_review": reply_res.requires_review,
                "confidence_score": reply_res.confidence_score,
                "reply_text": reply_res.data.get("reply_text"),
            }

            # Auto-dispatch if high confidence and no human review needed
            if not reply_res.requires_review:
                try:
                    tool = self.platform_registry.get(platform)
                    dispatch_res = await tool.send_reply(
                        thread_id=event.thread_id,
                        content=reply_res.data["reply_text"],
                        parent_comment_id=event.parent_id,
                    )
                    reply_info["dispatched"] = dispatch_res.success
                    reply_info["platform_message_id"] = dispatch_res.platform_message_id
                except Exception as exc:
                    logger.error("auto_dispatch_failed", error=str(exc))
                    reply_info["dispatch_error"] = str(exc)

        return {
            "status": "success",
            "lead_id": lead_id,
            "conversation_id": str(conv_id),
            "reply": reply_info,
        }


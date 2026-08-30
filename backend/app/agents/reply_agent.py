from pathlib import Path
from uuid import UUID

import structlog
from jinja2 import Environment, FileSystemLoader

from app.agents.base import AgentResult, BaseAgent
from app.exceptions import LLMError
from app.models.enums import ReviewStatus
from app.repositories.message_repo import MessageRepository
from app.tools.ai.llm_client import LLMClient
from app.tools.ai.rag_tool import RAGTool

logger = structlog.get_logger()


class ReplyAgent(BaseAgent):
    """Generates context-aware, knowledge-grounded AI replies with human-in-the-loop confidence thresholds."""

    def __init__(
        self,
        message_repo: MessageRepository | None = None,
        llm_client: LLMClient | None = None,
        rag_tool: RAGTool | None = None,
        confidence_threshold: float = 0.85,
    ):
        super().__init__(name="ReplyAgent", confidence_threshold=confidence_threshold)
        self.message_repo = message_repo
        self.llm = llm_client or LLMClient()
        self.rag = rag_tool

        prompt_dir = Path(__file__).parent.parent / "prompts"
        self.jinja_env = Environment(loader=FileSystemLoader(str(prompt_dir)), autoescape=False)

    async def generate_reply_content(
        self,
        incoming_message: str,
        conversation_history: list[dict] | None = None,
        platform: str = "linkedin",
        lead_name: str | None = None,
        lead_company: str | None = None,
        sentiment: str = "neutral",
    ) -> AgentResult:
        """Pure reasoning seam: Generate reply text and compute confidence without DB dependency."""
        self.logger.info(
            "generating_reply_content",
            platform=platform,
            sentiment=sentiment,
        )

        formatted_history = conversation_history or []

        # Retrieve RAG grounding knowledge
        product_knowledge = ""
        rag_sources: list[str] = []
        if self.rag and incoming_message:
            try:
                rag_res = await self.rag.retrieve_context(query=incoming_message, limit=2)
                product_knowledge = rag_res.context_text
                rag_sources = [f"doc_{doc.get('id', 'unknown')}" for doc in rag_res.documents]
            except Exception as exc:
                self.logger.warning("rag_retrieval_failed_for_reply", error=str(exc))

        # Render prompt
        template = self.jinja_env.get_template("reply_generation.j2")
        prompt = template.render(
            platform=platform,
            incoming_message=incoming_message,
            lead_name=lead_name or "there",
            lead_company=lead_company or "",
            conversation_history=formatted_history,
            product_knowledge=product_knowledge,
        )

        try:
            llm_response = await self.llm.generate(
                prompt=prompt,
                temperature=0.5,
                max_tokens=500,
            )

            reply_text = llm_response.text.strip()
            if reply_text.startswith('"') and reply_text.endswith('"'):
                reply_text = reply_text[1:-1]

            # Confidence scoring heuristic
            confidence = 0.88
            if product_knowledge:
                confidence += 0.07
            if sentiment == "negative":
                confidence -= 0.20
            elif sentiment == "inquisitive" and not product_knowledge:
                confidence -= 0.15
            if len(reply_text) < 15:
                confidence -= 0.20

            confidence = max(0.1, min(1.0, confidence))
            success, requires_review = self.evaluate_confidence(confidence)
            review_status = ReviewStatus.PENDING.value if requires_review else ReviewStatus.APPROVED.value

            return AgentResult(
                success=True,
                confidence_score=round(confidence, 2),
                requires_review=requires_review,
                data={
                    "reply_text": reply_text,
                    "requires_review": requires_review,
                    "review_status": review_status,
                    "confidence_score": round(confidence, 2),
                    "rag_sources": rag_sources,
                    "llm_model": llm_response.model,
                    "latency_ms": llm_response.latency_ms,
                },
                reasoning=f"Generated reply with confidence {confidence:.2f} (requires_review={requires_review}).",
            )
        except Exception as exc:
            self.logger.error("reply_generation_failed", error=str(exc))
            raise LLMError(f"Reply generation failed: {exc}") from exc

    async def generate_reply(
        self,
        conversation_id: UUID,
        incoming_message: str,
        platform: str = "linkedin",
        lead_name: str | None = None,
        lead_company: str | None = None,
        sentiment: str = "neutral",
    ) -> AgentResult:
        """Fetch history, run pure reasoning, and optionally persist outbound message."""
        self.logger.info(
            "generating_reply",
            conversation_id=str(conversation_id),
            platform=platform,
            sentiment=sentiment,
        )

        formatted_history: list[dict] = []
        if self.message_repo:
            history_msgs = await self.message_repo.get_messages_for_conversation(
                conversation_id=conversation_id,
                limit=10,
            )
            formatted_history = [
                {"direction": msg.direction, "content": msg.content}
                for msg in history_msgs
            ]

        # Call pure reasoning method
        result = await self.generate_reply_content(
            incoming_message=incoming_message,
            conversation_history=formatted_history,
            platform=platform,
            lead_name=lead_name,
            lead_company=lead_company,
            sentiment=sentiment,
        )

        # Optional persistence if message_repo is attached
        if self.message_repo:
            outbound_msg = await self.message_repo.create(
                conversation_id=conversation_id,
                direction="outbound",
                content=result.data["reply_text"],
                content_type="text",
                platform=platform,
                confidence_score=result.confidence_score,
                requires_review=result.requires_review,
                review_status=result.data["review_status"],
                llm_model=result.data.get("llm_model"),
                generation_time_ms=result.data.get("latency_ms"),
            )
            result.data["message_id"] = str(outbound_msg.id)

        return result

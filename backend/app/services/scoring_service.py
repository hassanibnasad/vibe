from datetime import UTC, datetime
from uuid import UUID
import structlog

from app.agents.lead_qualifier import LeadQualifierAgent
from app.exceptions import LeadNotFoundError
from app.models.lead import Lead
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.repositories.score_event_repo import ScoreEventRepository

logger = structlog.get_logger()


class ScoringService:
    """Service orchestrating BANT lead qualification, scoring events, and funnel transitions."""

    def __init__(
        self,
        lead_repo: LeadRepository,
        score_event_repo: ScoreEventRepository,
        conversation_repo: ConversationRepository,
        message_repo: MessageRepository,
        qualifier_agent: LeadQualifierAgent | None = None,
    ):
        self.lead_repo = lead_repo
        self.score_event_repo = score_event_repo
        self.conversation_repo = conversation_repo
        self.message_repo = message_repo
        self.agent = qualifier_agent or LeadQualifierAgent()

    async def evaluate_and_update_lead(
        self,
        lead_id: UUID,
        event_type: str = "conversation_interaction",
    ) -> Lead:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise LeadNotFoundError(f"Lead {lead_id} not found")

        # 1. Fetch conversations and messages
        conversations = await self.conversation_repo.get_active_by_lead(lead_id)
        conversation_history: list[dict] = []
        if conversations:
            latest_conv = conversations[0]
            messages = await self.message_repo.get_messages_for_conversation(latest_conv.id, limit=10)
            conversation_history = [
                {"direction": msg.direction, "content": msg.content}
                for msg in messages
            ]

        # 2. Run Qualifier Agent
        result = await self.agent.qualify_lead(
            lead_name=lead.name,
            lead_company=lead.company,
            lead_job_title=lead.job_title,
            current_score=lead.lead_score,
            conversation_history=conversation_history,
        )

        data = result.data
        new_score = data["new_score"]
        score_delta = data["score_delta"]
        new_stage = data["new_stage"]
        reason = data["reason"]
        pain_points = list(set((lead.pain_points or []) + data.get("pain_points", [])))
        interests = list(set((lead.interests or []) + data.get("interests", [])))

        # 3. Log LeadScoreEvent if score changed
        if score_delta != 0 or lead.lead_score != new_score:
            await self.score_event_repo.create(
                lead_id=lead.id,
                event_type=event_type,
                score_before=lead.lead_score,
                score_after=new_score,
                score_delta=score_delta,
                reason=reason,
                metadata_={
                    "stage_before": lead.lead_stage,
                    "stage_after": new_stage,
                },
            )

        # 4. Update Lead record
        update_fields: dict = {
            "lead_score": new_score,
            "lead_stage": new_stage,
            "pain_points": pain_points,
            "interests": interests,
            "last_interaction_at": datetime.now(UTC),
        }
        if new_stage in ("mql", "sql") and not lead.qualified_at:
            update_fields["qualified_at"] = datetime.now(UTC)

        updated_lead = await self.lead_repo.update(lead.id, **update_fields)
        logger.info(
            "lead_score_updated",
            lead_id=str(lead.id),
            old_score=lead.lead_score,
            new_score=new_score,
            new_stage=new_stage,
        )
        return updated_lead  # type: ignore[return-value]

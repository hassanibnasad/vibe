from datetime import UTC, datetime
from typing import Any
from uuid import UUID

import structlog

from app.agents.lead_qualifier import LeadQualifierAgent
from app.exceptions import LeadNotFoundError
from app.models.enums import LeadStage, calculate_lead_stage
from app.models.lead import Lead
from app.models.lead_field_history import LeadFieldHistory
from app.repositories.lead_repo import LeadRepository
from app.repositories.score_event_repo import ScoreEventRepository

logger = structlog.get_logger()


class LeadService:
    """Deep domain service orchestrating lead lifecycle, scoring, BANT qualification, and CRM funnel transitions."""

    def __init__(
        self,
        lead_repo: LeadRepository,
        score_event_repo: ScoreEventRepository,
        qualifier_agent: LeadQualifierAgent | None = None,
    ):
        self.lead_repo = lead_repo
        self.score_event_repo = score_event_repo
        self.agent = qualifier_agent or LeadQualifierAgent()

    async def get_lead(self, lead_id: UUID) -> Lead:
        """Fetch lead by ID or raise LeadNotFoundError."""
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise LeadNotFoundError(f"Lead {lead_id} not found")
        return lead

    async def filter_leads(
        self,
        stage: str | None = None,
        min_score: int | None = None,
        platform: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Lead], int]:
        """Query and paginate leads with criteria filtering."""
        return await self.lead_repo.filter_leads(
            stage=stage,
            min_score=min_score,
            platform=platform,
            skip=skip,
            limit=limit,
        )

    async def get_pipeline_summary(self) -> dict[str, int]:
        """Aggregate lead counts across all funnel stages."""
        counts = await self.lead_repo.get_pipeline_counts()
        return {
            LeadStage.COLD.value: counts.get(LeadStage.COLD.value, 0),
            LeadStage.WARM.value: counts.get(LeadStage.WARM.value, 0),
            LeadStage.HOT.value: counts.get(LeadStage.HOT.value, 0),
            LeadStage.MQL.value: counts.get(LeadStage.MQL.value, 0),
            LeadStage.SQL.value: counts.get(LeadStage.SQL.value, 0),
        }

    async def create_lead(
        self,
        platform: str,
        platform_user_id: str,
        **kwargs: Any,
    ) -> Lead:
        """Create a new lead with initial score and stage calculation."""
        lead_score = kwargs.get("lead_score", 0)
        kwargs.setdefault("lead_stage", calculate_lead_stage(lead_score))
        return await self.lead_repo.create(
            platform=platform,
            platform_user_id=platform_user_id,
            **kwargs,
        )

    async def update_lead(self, lead_id: UUID, **update_data: Any) -> Lead:
        """Update lead details with automatic stage synchronization."""
        lead = await self.get_lead(lead_id)

        # Synchronize stage if score is updated without explicit stage override
        if "lead_score" in update_data and "lead_stage" not in update_data:
            update_data["lead_stage"] = calculate_lead_stage(update_data["lead_score"])

        target_stage = update_data.get("lead_stage", lead.lead_stage)
        if target_stage in (LeadStage.MQL.value, LeadStage.SQL.value) and not lead.qualified_at:
            update_data["qualified_at"] = datetime.now(UTC)

        updated = await self.lead_repo.update(lead_id, **update_data)
        logger.info("lead_updated", lead_id=str(lead_id), stage=target_stage)
        return updated  # type: ignore[return-value]

    async def adjust_lead_score(
        self,
        lead_id: UUID,
        new_score: int,
        reason: str,
        event_type: str = "manual_adjustment",
    ) -> Lead:
        """Adjust a lead's score, record the audit event, and transition stage."""
        lead = await self.get_lead(lead_id)
        old_score = lead.lead_score
        new_score = max(0, min(100, new_score))
        new_stage = calculate_lead_stage(new_score)

        update_fields: dict[str, Any] = {
            "lead_score": new_score,
            "lead_stage": new_stage,
            "last_interaction_at": datetime.now(UTC),
        }
        if new_stage in (LeadStage.MQL.value, LeadStage.SQL.value) and not lead.qualified_at:
            update_fields["qualified_at"] = datetime.now(UTC)

        updated_lead = await self.lead_repo.update(lead_id, **update_fields)

        # Log audit trail event
        await self.score_event_repo.create(
            lead_id=lead_id,
            event_type=event_type,
            score_before=old_score,
            score_after=new_score,
            score_delta=new_score - old_score,
            reason=reason,
            metadata_={
                "stage_before": lead.lead_stage,
                "stage_after": new_stage,
            },
        )

        logger.info(
            "lead_score_adjusted",
            lead_id=str(lead_id),
            old_score=old_score,
            new_score=new_score,
            new_stage=new_stage,
        )
        return updated_lead  # type: ignore[return-value]

    async def process_incoming_turn(
        self,
        lead_id: UUID,
        new_user_message: str,
    ) -> tuple[Lead, list[LeadFieldHistory]]:
        """Process incoming user turn via pure agent reasoning and persist changelog/memory."""
        lead = await self.get_lead(lead_id)

        current_state = {
            "budget": lead.budget,
            "authority": lead.authority,
            "need": lead.need,
            "timeline": lead.timeline,
        }

        # 1. Pure reasoning extraction
        result = await self.agent.extract_bant_facts(
            current_state=current_state,
            new_user_message=new_user_message,
        )

        changes = result.data.get("changes", {})
        new_score = result.data.get("new_score", lead.lead_score)
        new_stage = result.data.get("new_stage", lead.lead_stage)
        is_qualified = result.data.get("is_qualified", False)

        history_records: list[LeadFieldHistory] = []
        for field, diff in changes.items():
            record = LeadFieldHistory(
                tenant_id=lead.tenant_id,
                lead_id=lead.id,
                field=field,
                old_value=diff["old"],
                new_value=diff["new"],
            )
            self.lead_repo.session.add(record)
            history_records.append(record)
            setattr(lead, field, diff["new"])

        lead.is_qualified = is_qualified
        lead.lead_score = new_score
        lead.lead_stage = new_stage
        lead.last_interaction_at = datetime.now(UTC)

        if new_stage in (LeadStage.MQL.value, LeadStage.SQL.value) and not lead.qualified_at:
            lead.qualified_at = datetime.now(UTC)

        await self.lead_repo.session.flush()
        await self.lead_repo.session.refresh(lead)

        logger.info(
            "lead_turn_processed",
            lead_id=str(lead_id),
            changes_count=len(changes),
            score=new_score,
            stage=new_stage,
        )
        return lead, history_records

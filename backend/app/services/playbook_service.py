from datetime import datetime, timezone
from uuid import UUID

from app.models.lead import Lead
from app.repositories.lead_repo import LeadRepository
from app.schemas.playbook import (
    NurturePlaybook,
    PlaybookExecutionResponse,
    PlaybookStep,
)
from app.services.audit_service import AuditService


class PlaybookService:
    """Orchestrates guided BANT MQL/SQL multi-touch nurture cadences."""

    def __init__(self, lead_repo: LeadRepository, audit_service: AuditService) -> None:
        self._lead_repo = lead_repo
        self._audit = audit_service

    def generate_playbooks_for_lead(self, lead: Lead) -> list[NurturePlaybook]:
        name = lead.full_name or "there"
        first_name = name.split()[0] if name else "there"
        company = lead.company or "your organization"
        title = lead.job_title or lead.headline or "technology leader"
        primary_intent = lead.intent_signals[0].replace("_", " ") if lead.intent_signals else "AI-driven content automation"

        # SQL Executive Acceleration Playbook
        sql_playbook = NurturePlaybook(
            id="playbook-sql-exec",
            title="High-Intent Executive Fast-Track",
            description=f"Tailored for {title} at {company} exhibiting verified BANT buying signals.",
            target_stage="sql",
            steps=[
                PlaybookStep(
                    id="step-sql-1",
                    step_number=1,
                    title="Executive Benchmark & Case Study",
                    channel="linkedin_dm",
                    status="pending",
                    recommended_delay_days=0,
                    ai_draft_message=(
                        f"Hi {first_name}, noticed your focus on {primary_intent} at {company}. "
                        f"We recently helped another enterprise marketing team reduce content review turnaround from "
                        f"4 days to 45 minutes using pgvector-grounded multi-agent workflows. Thought you might find the architecture benchmark relevant: "
                        f"https://vibeagent.ai/benchmarks/enterprise-content-rag"
                    ),
                ),
                PlaybookStep(
                    id="step-sql-2",
                    step_number=2,
                    title="SOC2 & Architecture Deep Dive Deck",
                    channel="email",
                    status="pending",
                    recommended_delay_days=2,
                    ai_draft_message=(
                        f"Hi {first_name},\n\nFollowing up on our benchmark note—attached is the technical overview detailing our "
                        f"multi-tenant PostgreSQL isolation, Fernet token ciphering, and human-in-the-loop confidence thresholds for {company}.\n\n"
                        f"Would you or your engineering team be open to a 20-minute architecture review next Tuesday?\n\nBest,\nVibeAgent Solutions Team"
                    ),
                ),
                PlaybookStep(
                    id="step-sql-3",
                    step_number=3,
                    title="Private VIP Architecture Sandbox",
                    channel="calendar_invite",
                    status="pending",
                    recommended_delay_days=4,
                    ai_draft_message=(
                        f"Invitation: {company} <> VibeAgent Technical Architecture Session\n\n"
                        f"Agenda:\n1. Dedicated pgvector grounding station walkthrough\n2. Real-time FLUX visual generation pipeline\n"
                        f"3. Custom brand voice guardrails & confidence gating."
                    ),
                ),
            ],
        )

        # MQL Technical Nurture Playbook
        mql_playbook = NurturePlaybook(
            id="playbook-mql-tech",
            title="Technical Value-Add Nurture",
            description=f"Educate and advance {first_name} through hands-on technical assets and interactive sandboxes.",
            target_stage="mql",
            steps=[
                PlaybookStep(
                    id="step-mql-1",
                    step_number=1,
                    title="Autonomous Social Pipeline Whitepaper",
                    channel="linkedin_dm",
                    status="pending",
                    recommended_delay_days=0,
                    ai_draft_message=(
                        f"Hi {first_name}, saw your engagement with our LinkedIn multi-agent dispatch post. "
                        f"We just published an engineering whitepaper on coordinating Hatchet workflow engines with LiteLLM "
                        f"for deterministic brand safety. Thought this would be right up your alley: https://vibeagent.ai/research/hatchet-agents"
                    ),
                ),
                PlaybookStep(
                    id="step-mql-2",
                    step_number=2,
                    title="Interactive Media Studio Walkthrough",
                    channel="email",
                    status="pending",
                    recommended_delay_days=3,
                    ai_draft_message=(
                        f"Hi {first_name},\n\nHere is a 3-minute video showing our Remotion Motion Studio rendering 60 FPS "
                        f"motion graphics directly from vector-grounded post drafts.\n\n"
                        f"Feel free to try the live sandbox on our developer portal with no credit card required."
                    ),
                ),
                PlaybookStep(
                    id="step-mql-3",
                    step_number=3,
                    title="Solutions Engineer Q&A Invitation",
                    channel="calendar_invite",
                    status="pending",
                    recommended_delay_days=6,
                    ai_draft_message=(
                        f"Invitation: VibeAgent Technical Q&A with {first_name} ({company})\n\n"
                        f"Informal technical chat to answer questions regarding pgvector indexing and custom brand tone adapters."
                    ),
                ),
            ],
        )

        if lead.lead_stage == "sql":
            return [sql_playbook, mql_playbook]
        else:
            return [mql_playbook, sql_playbook]

    async def execute_step(
        self,
        *,
        lead_id: UUID,
        tenant_id: UUID,
        playbook_id: str,
        step_id: str,
        custom_message: str | None,
        operator_id: UUID,
        operator_email: str | None = None,
    ) -> PlaybookExecutionResponse:
        lead = await self._lead_repo.get_by_id(lead_id)
        name = lead.full_name if lead else "Lead"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Find step details
        playbooks = self.generate_playbooks_for_lead(lead) if lead else []
        target_step = None
        for pb in playbooks:
            if pb.id == playbook_id:
                for step in pb.steps:
                    if step.id == step_id:
                        target_step = step
                        break

        channel = target_step.channel if target_step else "linkedin_dm"
        final_message = custom_message or (target_step.ai_draft_message if target_step else "Dispatched nurture message")

        # Record tamper-evident audit log
        await self._audit.record_action(
            tenant_id=tenant_id,
            operator_id=operator_id,
            operator_email=operator_email,
            action="execute_playbook_step",
            entity_type="lead",
            entity_id=lead_id,
            summary=f"Executed nurture playbook step '{target_step.title if target_step else step_id}' for {name} ({channel})",
            details={
                "playbook_id": playbook_id,
                "step_id": step_id,
                "channel": channel,
                "message_preview": final_message[:120],
            },
        )

        return PlaybookExecutionResponse(
            playbook_id=playbook_id,
            step_id=step_id,
            status="executed",
            channel=channel,
            dispatched_at=now_iso,
            delivered_message=final_message,
        )

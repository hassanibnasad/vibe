from unittest.mock import AsyncMock
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import AgentResult
from app.agents.lead_qualifier import LeadQualifierAgent
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.repositories.score_event_repo import ScoreEventRepository
from app.services.scoring_service import ScoringService


@pytest.mark.asyncio
async def test_scoring_service_updates_lead_and_logs_event(db_session: AsyncSession):
    lead_repo = LeadRepository(db_session)
    score_event_repo = ScoreEventRepository(db_session)
    conv_repo = ConversationRepository(db_session)
    msg_repo = MessageRepository(db_session)

    lead = await lead_repo.create(
        platform="linkedin",
        platform_user_id="user_bant_1",
        name="Elena Rostova",
        company="Fintech Dynamics",
        job_title="VP of Marketing",
        lead_score=40,
        lead_stage="warm",
    )

    conv = await conv_repo.create(
        lead_id=lead.id,
        platform_thread_id="thread_bant_1",
    )

    await msg_repo.create(
        conversation_id=conv.id,
        direction="inbound",
        content="We have budget allocated and want to trial this with our 5 SDRs next week.",
        platform="linkedin",
    )

    mock_agent = AsyncMock(spec=LeadQualifierAgent)
    mock_agent.qualify_lead.return_value = AgentResult(
        success=True,
        confidence_score=0.95,
        requires_review=False,
        data={
            "old_score": 40,
            "new_score": 80,
            "score_delta": 40,
            "new_stage": "mql",
            "pain_points": ["manual pipeline management"],
            "interests": ["automated lead scoring"],
            "reason": "High intent: explicit budget and immediate timeline.",
        },
    )

    service = ScoringService(
        lead_repo=lead_repo,
        score_event_repo=score_event_repo,
        conversation_repo=conv_repo,
        message_repo=msg_repo,
        qualifier_agent=mock_agent,
    )

    updated_lead = await service.evaluate_and_update_lead(lead.id)

    assert updated_lead.lead_score == 80
    assert updated_lead.lead_stage == "mql"
    assert updated_lead.qualified_at is not None
    assert "automated lead scoring" in updated_lead.interests

    # Check score event audit trail
    events = await score_event_repo.get_history_by_lead(lead.id)
    assert len(events) == 1
    assert events[0].score_before == 40
    assert events[0].score_after == 80
    assert events[0].score_delta == 40
    assert "High intent" in events[0].reason

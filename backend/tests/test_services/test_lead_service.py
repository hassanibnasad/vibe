from unittest.mock import AsyncMock
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.lead_qualifier import BantExtraction, LeadQualifierAgent
from app.models.enums import LeadStage
from app.repositories.lead_repo import LeadRepository
from app.repositories.score_event_repo import ScoreEventRepository
from app.services.lead_service import LeadService
from app.tools.ai.llm_client import LLMResponse


@pytest.mark.asyncio
async def test_lead_service_create_and_get(db_session: AsyncSession):
    lead_repo = LeadRepository(db_session)
    score_repo = ScoreEventRepository(db_session)
    service = LeadService(lead_repo=lead_repo, score_event_repo=score_repo)

    lead = await service.create_lead(
        platform="linkedin",
        platform_user_id="user_test_svc_1",
        name="Jordan Lee",
        lead_score=25,
    )

    assert lead.id is not None
    assert lead.name == "Jordan Lee"
    assert lead.lead_stage == LeadStage.WARM.value

    fetched = await service.get_lead(lead.id)
    assert fetched.id == lead.id


@pytest.mark.asyncio
async def test_lead_service_adjust_score_and_audit(db_session: AsyncSession):
    lead_repo = LeadRepository(db_session)
    score_repo = ScoreEventRepository(db_session)
    service = LeadService(lead_repo=lead_repo, score_event_repo=score_repo)

    lead = await service.create_lead(
        platform="linkedin",
        platform_user_id="user_test_svc_2",
        name="Morgan Hayes",
        lead_score=10,
    )

    updated = await service.adjust_lead_score(
        lead_id=lead.id,
        new_score=85,
        reason="Expressed strong interest and confirmed budget in direct message",
    )

    assert updated.lead_score == 85
    assert updated.lead_stage == LeadStage.MQL.value
    assert updated.qualified_at is not None

    events = await score_repo.get_history_by_lead(lead.id)
    assert len(events) == 1
    assert events[0].score_before == 10
    assert events[0].score_after == 85
    assert events[0].score_delta == 75


@pytest.mark.asyncio
async def test_lead_service_process_incoming_turn(db_session: AsyncSession):
    lead_repo = LeadRepository(db_session)
    score_repo = ScoreEventRepository(db_session)

    extracted_data = BantExtraction(
        extracted_budget={"amount": 50000, "currency": "USD"},
        extracted_authority={"role": "CTO", "is_decision_maker": True},
        extracted_need={"core_problem": "Need automated social pipeline"},
        extracted_timeline={"timeframe": "Next month"},
    )
    mock_llm = AsyncMock()
    mock_llm.generate_structured.return_value = (
        extracted_data,
        LLMResponse(text="", model="llama3.1:70b", tokens_used=100, latency_ms=200),
    )

    agent = LeadQualifierAgent(llm_client=mock_llm)
    service = LeadService(lead_repo=lead_repo, score_event_repo=score_repo, qualifier_agent=agent)

    lead = await service.create_lead(
        platform="linkedin",
        platform_user_id="user_test_svc_3",
        name="Taylor Reed",
    )

    updated_lead, history = await service.process_incoming_turn(
        lead_id=lead.id,
        new_user_message="I'm the CTO and we have $50k budget for this next month.",
    )

    assert updated_lead.is_qualified is True
    assert updated_lead.lead_score == 100
    assert updated_lead.lead_stage == LeadStage.SQL.value
    assert len(history) == 4

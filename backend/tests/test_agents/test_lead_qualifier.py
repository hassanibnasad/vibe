import json
from unittest.mock import AsyncMock
import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.lead_qualifier import (
    BantExtraction,
    LeadQualifierAgent,
    calculate_stage,
    compute_bant_score,
)
from app.models.lead import Lead
from app.models.lead_field_history import LeadFieldHistory
from app.repositories.lead_repo import LeadRepository
from app.tools.ai.llm_client import LLMResponse


def test_calculate_stage_thresholds():
    assert calculate_stage(95) == "sql"
    assert calculate_stage(90) == "sql"
    assert calculate_stage(80) == "mql"
    assert calculate_stage(60) == "hot"
    assert calculate_stage(30) == "warm"
    assert calculate_stage(10) == "cold"


@pytest.mark.asyncio
async def test_lead_qualifier_agent_success():
    mock_llm = AsyncMock()
    mock_llm.generate.return_value = LLMResponse(
        text=json.dumps({
            "score_delta": 25,
            "pain_points": ["slow manual outreach", "low reply rate"],
            "interests": ["automated lead qualification", "enterprise SSO"],
            "reason": "Clear BANT match: budget ready and explicit timeline of next month."
        }),
        model="llama3.1:70b",
        tokens_used=120,
        latency_ms=450,
    )

    agent = LeadQualifierAgent(llm_client=mock_llm)
    result = await agent.qualify_lead(
        lead_name="Marcus Vance",
        lead_company="Apex Global",
        lead_job_title="Head of Growth",
        current_score=35,
        conversation_history=[
            {"direction": "user", "content": "We have 10 SDRs and need this automated by next quarter."}
        ],
    )

    assert result.success is True
    assert result.data["old_score"] == 35
    assert result.data["new_score"] == 60
    assert result.data["new_stage"] == "hot"
    assert "automated lead qualification" in result.data["interests"]
    assert "slow manual outreach" in result.data["pain_points"]


@pytest.mark.asyncio
async def test_process_lead_turn_extraction_and_changelog(db_session: AsyncSession):
    # 1. Setup existing lead in DB
    lead_repo = LeadRepository(db_session)
    lead = await lead_repo.create(
        name="Sarah Connor",
        platform="linkedin",
        platform_user_id="li_user_sarah_101",
        budget={},
        authority={},
        need={},
        timeline={},
        is_qualified=False,
    )

    # 2. Mock LLM structured response
    extracted_data = BantExtraction(
        extracted_budget={"amount": 25000, "currency": "USD", "notes": "Approved for Q3"},
        extracted_authority={"role": "VP Engineering", "is_decision_maker": True},
        extracted_need={"core_problem": "Manual SDR workflow bottlenecks"},
        extracted_timeline={"timeframe": "Q3 2026", "urgency": "high"},
    )
    mock_llm = AsyncMock()
    mock_llm.generate_structured.return_value = (
        extracted_data,
        LLMResponse(text="", model="llama3.1:70b", tokens_used=150, latency_ms=300),
    )

    agent = LeadQualifierAgent(llm_client=mock_llm)

    # 3. Process turn
    updated_lead, history = await agent.process_lead_turn(
        db_session=db_session,
        lead_id=lead.id,
        new_user_message="I'm the VP of Engineering. We have $25k allocated to fix manual SDR bottlenecks in Q3.",
    )

    # 4. Verify working memory state
    assert updated_lead.is_qualified is True
    assert updated_lead.lead_score == 100
    assert updated_lead.lead_stage == "sql"
    assert updated_lead.budget["amount"] == 25000
    assert updated_lead.authority["role"] == "VP Engineering"
    assert updated_lead.need["core_problem"] == "Manual SDR workflow bottlenecks"
    assert updated_lead.timeline["timeframe"] == "Q3 2026"

    # 5. Verify append-only changelog
    assert len(history) == 4
    fields_changed = {h.field for h in history}
    assert fields_changed == {"budget", "authority", "need", "timeline"}

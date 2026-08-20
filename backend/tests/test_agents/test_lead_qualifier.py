import json
from unittest.mock import AsyncMock
import pytest

from app.agents.lead_qualifier import LeadQualifierAgent, calculate_stage
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

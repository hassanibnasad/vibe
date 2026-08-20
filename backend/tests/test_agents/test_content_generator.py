import json
from unittest.mock import AsyncMock

import pytest

from app.agents.content_generator import ContentGeneratorAgent
from app.tools.ai.llm_client import LLMResponse


@pytest.mark.asyncio
async def test_content_generator_agent_success():
    mock_llm = AsyncMock()
    mock_llm.generate.return_value = LLMResponse(
        text=json.dumps({
            "content": "🚀 Excited to announce our autonomous AI agent for B2B growth! It qualifies leads 24/7.",
            "hashtags": ["#AI", "#Marketing", "#B2BGrowth"],
            "cta": "What marketing workflow takes up most of your team's time?"
        }),
        model="llama3.1:8b",
        tokens_used=120,
        latency_ms=450,
    )

    agent = ContentGeneratorAgent(llm_client=mock_llm)
    result = await agent.generate_post(
        brief="Announce autonomous marketing AI agent",
        platform="linkedin",
        tone="professional",
    )

    assert result.success is True
    assert result.confidence_score >= 0.80
    assert "🚀 Excited to announce" in result.data["content"]
    assert len(result.data["hashtags"]) == 3
    assert result.data["platform"] == "linkedin"

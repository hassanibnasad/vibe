import json
from unittest.mock import AsyncMock

import pytest

from app.agents.content_generator import ContentGeneratorAgent
from app.tools.ai.llm_client import LLMResponse
from app.tools.ai.rag_tool import RAGResult


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


@pytest.mark.asyncio
async def test_content_generator_with_rag_context():
    mock_llm = AsyncMock()
    mock_llm.generate.return_value = LLMResponse(
        text=json.dumps({
            "content": "Enterprise AI for modern marketing teams. Secure, self-hosted, scalable.",
            "hashtags": ["#EnterpriseAI", "#B2B"],
            "cta": "Book an onboarding consultation."
        }),
        model="llama3.1:70b",
        tokens_used=140,
        latency_ms=620,
    )

    mock_rag = AsyncMock()
    mock_rag.retrieve_context.return_value = RAGResult(
        documents=[{"id": "doc-123", "title": "Brand Guidelines", "content": "Enterprise focus", "doc_type": "brand", "similarity": 0.92}],
        formatted_text="[BRAND] Brand Guidelines: Enterprise focus",
        top_score=0.92,
    )

    agent = ContentGeneratorAgent(llm_client=mock_llm, rag_tool=mock_rag)
    result = await agent.generate_post(
        brief="Enterprise product launch",
        platform="linkedin",
        tone="authoritative",
    )

    assert result.success is True
    assert result.confidence_score >= 0.85
    assert result.data["rag_sources"] == ["doc_doc-123"]
    mock_rag.retrieve_context.assert_awaited_once()


@pytest.mark.asyncio
async def test_content_generator_fallback_raw_text():
    mock_llm = AsyncMock()
    mock_llm.generate.return_value = LLMResponse(
        text="This is a raw text post without JSON formatting from the LLM.",
        model="llama3.1:8b",
        tokens_used=80,
        latency_ms=300,
    )

    agent = ContentGeneratorAgent(llm_client=mock_llm)
    result = await agent.generate_post(
        brief="Quick tip on social marketing",
        platform="twitter",
        tone="casual",
    )

    assert result.success is True
    assert result.requires_review is True
    assert "raw text post without JSON formatting" in result.data["content"]


@pytest.mark.asyncio
async def test_content_generator_generate_variants():
    mock_llm = AsyncMock()
    mock_llm.generate.return_value = LLMResponse(
        text=json.dumps({
            "content": "Variant post copy",
            "hashtags": ["#AI"],
            "cta": "Check it out"
        }),
        model="llama3.1:8b",
        tokens_used=50,
        latency_ms=200,
    )

    agent = ContentGeneratorAgent(llm_client=mock_llm)
    variants = await agent.generate_variants(
        brief="Multi-angle promotion",
        platform="linkedin",
        variants_count=3,
    )

    assert len(variants) == 3
    assert variants[0].data["variant_label"] == "A"
    assert variants[1].data["variant_label"] == "B"
    assert variants[2].data["variant_label"] == "C"
    assert variants[0].data["variant_group"] is not None
    assert variants[0].data["variant_group"] == variants[1].data["variant_group"]

from unittest.mock import AsyncMock

import pytest

from app.services.brand_synthesis_service import (
    BrandSynthesisService,
    ConversionAssets,
    TextAnalysisResult,
    WrittenIdentity,
)
from app.tools.ai.llm_client import LLMResponse


@pytest.mark.asyncio
async def test_brand_synthesis_service_text_only():
    mock_llm = AsyncMock()
    mock_response = LLMResponse(
        text="{}",
        model="fast",
        tokens_used=100,
        latency_ms=200,
    )
    mock_llm.generate_structured.return_value = (
        TextAnalysisResult(
            tagline="AI-powered B2B Growth Engine",
            written_identity=WrittenIdentity(
                archetype="Technical Innovator",
                tone_attributes=["Direct", "Authoritative", "Analytical"],
                banned_words=["synergy", "paradigm"],
                formatting_rules="Punchy short lines",
            ),
            core_value_props=["Zero-maintenance inbound marketing", "Autonomous multi-channel posting"],
            conversion_assets=ConversionAssets(
                lead_magnets=["2026 Marketing Automation Benchmark Report"],
                cta_templates=["Comment 'SCALE' for your personalized audit"],
                offer_hooks=["14-day free trial"],
            ),
            icp_pain_points=[],
        ),
        mock_response,
    )

    service = BrandSynthesisService(llm_client=mock_llm)
    result = await service.synthesize(
        markdown="# Acme AI\nWe build autonomous marketing engines.",
        screenshot_b64=None,
        url="https://acme.ai",
        brand_name="Acme AI",
    )

    assert result["brand_name"] == "Acme AI"
    assert result["tagline"] == "AI-powered B2B Growth Engine"
    assert result["written_identity"]["archetype"] == "Technical Innovator"
    assert "Direct" in result["written_identity"]["tone_attributes"]
    assert "visual_identity" in result

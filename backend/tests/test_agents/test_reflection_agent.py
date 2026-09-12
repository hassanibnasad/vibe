import json
import uuid
from unittest.mock import AsyncMock

import pytest

from app.agents.reflection_agent import ReflectionAgent
from app.models.post import Post
from app.repositories.brand_profile_repo import BrandProfileRepository
from app.repositories.performance_repo import PerformanceRepository
from app.repositories.post_repo import PostRepository
from app.tools.ai.llm_client import LLMResponse


@pytest.mark.asyncio
async def test_reflection_agent_success(db_session):
    tenant_id = uuid.uuid4()
    post_id = uuid.uuid4()

    # Create brand profile
    bp_repo = BrandProfileRepository(db_session)
    await bp_repo.upsert(
        tenant_id=tenant_id,
        brand_name="Acme Platform",
        extraction_status="complete",
        conversion_assets={"lead_magnets": ["Whitepaper"], "offer_hooks": []},
    )

    # Create post
    p_repo = PostRepository(db_session)
    post = Post(
        id=post_id,
        tenant_id=tenant_id,
        content="Here is the exact formula for scaling marketing workflows without code.",
        status="published",
    )
    db_session.add(post)

    # Create performance entry
    perf_repo = PerformanceRepository(db_session)
    await perf_repo.upsert_metrics(
        post_id=post_id,
        tenant_id=tenant_id,
        impressions=1000,
        likes=50,
        comments=20,
        leads_generated=5,
        leads_qualified=3,
    )
    await db_session.commit()

    mock_llm = AsyncMock()
    mock_llm.generate.return_value = LLMResponse(
        text=json.dumps({
            "winning_hooks": ["Here is the exact formula for scaling..."],
            "winning_ctas": ["Comment 'FORMULA' for the full template"],
            "dead_angles": ["Generic motivational quotes"],
            "actionable_takeaways": ["Use step-by-step breakdowns"],
            "summary": "Educational and tactical breakdowns outperformed high-level hype.",
        }),
        model="llama3.1:8b",
        tokens_used=250,
        latency_ms=500,
    )

    agent = ReflectionAgent(
        llm_client=mock_llm,
        post_repo=p_repo,
        performance_repo=perf_repo,
        brand_profile_repo=bp_repo,
    )

    result = await agent.reflect(tenant_id=tenant_id)
    await db_session.commit()

    assert result.success is True
    assert "Here is the exact formula for scaling..." in result.data["winning_hooks"]
    assert "Comment 'FORMULA' for the full template" in result.data["winning_ctas"]

    # Verify BrandProfile was updated with new assets
    updated_bp = await bp_repo.get_by_tenant(tenant_id)
    assert updated_bp is not None
    assert "Here is the exact formula for scaling..." in updated_bp.conversion_assets["offer_hooks"]
    assert "Comment 'FORMULA' for the full template" in updated_bp.conversion_assets["cta_templates"]

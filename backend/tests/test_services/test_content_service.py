import json
import uuid
from unittest.mock import AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.content_generator import ContentGeneratorAgent
from app.repositories.post_repo import PostRepository
from app.services.content_service import ContentService
from app.tools.ai.llm_client import LLMResponse


@pytest.mark.asyncio
async def test_content_service_generate_draft(db_session: AsyncSession):
    mock_llm = AsyncMock()
    mock_llm.generate.return_value = LLMResponse(
        text=json.dumps({
            "content": "Supercharge your outbound SDR pipeline with AI-driven lead scoring.",
            "hashtags": ["#SalesTech", "#OutboundAI"],
            "cta": "Drop a comment for early access."
        }),
        model="llama3.1:8b",
        tokens_used=95,
        latency_ms=320,
    )

    agent = ContentGeneratorAgent(llm_client=mock_llm)
    post_repo = PostRepository(db_session)
    service = ContentService(post_repo=post_repo, agent=agent)

    platform_id = uuid.uuid4()
    post = await service.generate_and_save_draft(
        brief="Promote AI lead qualification features",
        platform_id=platform_id,
        platform_type="linkedin",
        tone="authoritative",
    )

    assert post.id is not None
    assert post.status == "draft"
    assert post.ai_generated is True
    assert "Supercharge your outbound" in post.content
    assert post.confidence_score >= 0.80

    # Test approve workflow
    approved = await service.approve_post(post.id)
    assert approved.status == "approved"
    assert approved.requires_review is False

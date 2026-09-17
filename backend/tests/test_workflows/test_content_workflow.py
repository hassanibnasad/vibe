import json
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from hatchet_sdk import EmptyModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PostStatus
from app.repositories.post_repo import PostRepository
from app.tools.ai.llm_client import LLMResponse
from app.workflows.content_workflow import ContentPipelineInput, content_pipeline_task
from app.workflows.scheduled_publish import (
    PublishSinglePostInput,
    dispatch_due_posts_task,
    publish_single_post_task,
)


@pytest.mark.asyncio
async def test_content_pipeline_task_single_post(db_session: AsyncSession):
    """Test generating a single post draft via content_pipeline_task."""
    mock_generate = AsyncMock(
        return_value=LLMResponse(
            text=json.dumps({
                "content": "Announcing VibeAgent 1.0 with autonomous marketing agent workflows",
                "hashtags": ["#marketing", "#ai"],
                "cta": "Sign up for beta",
            }),
            model="llama3.1:8b",
            tokens_used=60,
            latency_ms=200,
        )
    )

    tenant_id = str(uuid.uuid4())
    inp = ContentPipelineInput(
        brief="Announcing VibeAgent 1.0 with autonomous marketing agent workflows",
        platform_id=tenant_id,
        platform_type="linkedin",
        tone="professional",
        variants_count=1,
        auto_publish=False,
    )

    with patch("app.tools.ai.llm_client.LLMClient.generate", mock_generate):
        res = await content_pipeline_task.aio_run(inp)

    assert res["status"] in ["draft", "requires_review", "published"]
    assert "post_id" in res
    assert len(res["post_ids"]) == 1


@pytest.mark.asyncio
async def test_content_pipeline_task_variants(db_session: AsyncSession):
    """Test generating post variants via content_pipeline_task."""
    mock_generate = AsyncMock(
        return_value=LLMResponse(
            text=json.dumps({
                "content": "Autonomous B2B marketing AI agent for founders",
                "hashtags": ["#b2b", "#ai"],
                "cta": "Check repo",
            }),
            model="llama3.1:8b",
            tokens_used=75,
            latency_ms=220,
        )
    )

    tenant_id = str(uuid.uuid4())
    inp = ContentPipelineInput(
        brief="Autonomous B2B marketing AI agent for founders",
        platform_id=tenant_id,
        platform_type="linkedin",
        tone="authoritative",
        variants_count=2,
        auto_publish=False,
    )

    with patch("app.tools.ai.llm_client.LLMClient.generate", mock_generate):
        res = await content_pipeline_task.aio_run(inp)

    assert "post_id" in res
    assert len(res["post_ids"]) == 2


@pytest.mark.asyncio
async def test_publish_single_post_task(db_session: AsyncSession):
    """Test publishing an existing draft post via publish_single_post_task."""
    post_repo = PostRepository(db_session)
    post = await post_repo.create(
        content="Ready to go live on LinkedIn via Hatchet task.",
        status=PostStatus.DRAFT.value,
        requires_review=False,
    )
    await db_session.commit()

    res = await publish_single_post_task.aio_run(
        PublishSinglePostInput(post_id=str(post.id))
    )
    assert res["status"] in [PostStatus.PUBLISHED.value, PostStatus.FAILED.value]
    assert res["post_id"] == str(post.id)


@pytest.mark.asyncio
async def test_dispatch_due_posts_task_cron_execution(db_session: AsyncSession):
    """Test the scheduled publish cron task execution."""
    res = await dispatch_due_posts_task.aio_run(EmptyModel())
    assert res["status"] == "success"
    assert "published_count" in res

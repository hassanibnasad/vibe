from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ReviewStatus
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.tools.ai.llm_client import LLMResponse
from app.workflows.engagement_workflow import (
    DispatchApprovedReplyInput,
    EngagementInput,
    dispatch_approved_reply_task,
    engagement_pipeline_task,
)


@pytest.mark.asyncio
async def test_engagement_pipeline_task_execution(db_session: AsyncSession):
    """Test full execution of engagement_pipeline_task via Hatchet task wrapper."""
    mock_generate = AsyncMock(
        return_value=LLMResponse(
            text="Hi Sarah! Yes, VibeAgent supports automated LinkedIn campaign scheduling and workflow execution.",
            model="llama3.1:8b",
            tokens_used=50,
            latency_ms=150,
        )
    )

    raw_event = {
        "id": "li_msg_workflow_1",
        "actor": "urn:li:person:workflow_actor_1",
        "author_name": "Sarah Connor",
        "author_headline": "Director of Cybernetics at TechCorp",
        "content": "Does VibeAgent support automated LinkedIn campaign scheduling?",
        "thread_id": "urn:li:activity:workflow_thread_1",
        "parent_id": None,
        "created_time": 1700000000,
    }

    with patch("app.tools.ai.llm_client.LLMClient.generate", mock_generate):
        result = await engagement_pipeline_task.aio_run(
            EngagementInput(platform="linkedin", raw_payload=raw_event)
        )

    assert result["status"] == "success"
    assert "lead_id" in result
    assert "conversation_id" in result
    assert result["reply"]["generated"] is True


@pytest.mark.asyncio
async def test_dispatch_approved_reply_task(db_session: AsyncSession):
    """Test durable operator approval dispatch task for HITL review items."""
    lead_repo = LeadRepository(db_session)
    conv_repo = ConversationRepository(db_session)
    msg_repo = MessageRepository(db_session)

    lead = await lead_repo.create(
        platform="linkedin", platform_user_id="user_wflow_rev", name="HITL Lead"
    )
    conv = await conv_repo.create(
        lead_id=lead.id, platform_thread_id="thread_wflow_rev"
    )
    msg = await msg_repo.create(
        conversation_id=conv.id,
        direction="outbound",
        content="AI suggested reply needing operator sign-off",
        platform="linkedin",
        requires_review=True,
        review_status=ReviewStatus.PENDING.value,
        confidence_score=0.60,
    )
    await db_session.commit()

    # Dispatch approval task
    res = await dispatch_approved_reply_task.aio_run(
        DispatchApprovedReplyInput(message_id=str(msg.id))
    )

    assert res["status"] == "success"
    assert res["message_id"] == str(msg.id)
    assert res["review_status"] == ReviewStatus.APPROVED.value

    # Refresh DB instance to verify persistence from the task's session
    await db_session.refresh(msg)
    assert msg.requires_review is False
    assert msg.review_status == ReviewStatus.APPROVED.value


@pytest.mark.asyncio
async def test_dispatch_approved_reply_task_with_edit(db_session: AsyncSession):
    """Test approval with custom operator edit text."""
    lead_repo = LeadRepository(db_session)
    conv_repo = ConversationRepository(db_session)
    msg_repo = MessageRepository(db_session)

    lead = await lead_repo.create(
        platform="linkedin", platform_user_id="user_wflow_edit", name="Edit Lead"
    )
    conv = await conv_repo.create(
        lead_id=lead.id, platform_thread_id="thread_wflow_edit"
    )
    msg = await msg_repo.create(
        conversation_id=conv.id,
        direction="outbound",
        content="Original imperfect reply",
        platform="linkedin",
        requires_review=True,
        review_status=ReviewStatus.PENDING.value,
    )
    await db_session.commit()

    # Dispatch approval task with edited copy
    edited_text = "Polished human-edited response ready for LinkedIn."
    res = await dispatch_approved_reply_task.aio_run(
        DispatchApprovedReplyInput(
            message_id=str(msg.id), custom_reply=edited_text
        )
    )

    assert res["status"] == "success"
    assert res["review_status"] == ReviewStatus.APPROVED.value

    # Refresh DB instance to verify persistence from the task's session
    await db_session.refresh(msg)
    assert msg.content == edited_text
    assert msg.original_content == "Original imperfect reply"
    assert msg.requires_review is False

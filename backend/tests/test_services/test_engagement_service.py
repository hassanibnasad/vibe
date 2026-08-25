from unittest.mock import AsyncMock
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ReviewStatus
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.services.engagement_service import EngagementService
from app.tools.ai.llm_client import LLMResponse
from app.tools.ai.sentiment_tool import SentimentTool
from app.tools.platform.registry import PlatformRegistry


@pytest.mark.asyncio
async def test_engagement_service_ingest_and_reply(db_session: AsyncSession):
    lead_repo = LeadRepository(db_session)
    conv_repo = ConversationRepository(db_session)
    msg_repo = MessageRepository(db_session)

    mock_llm = AsyncMock()
    mock_llm.generate.return_value = LLMResponse(
        text="Thanks for reaching out! Here are the details you requested.",
        model="llama3.1:8b",
        tokens_used=50,
        latency_ms=180,
    )

    registry = PlatformRegistry()
    sentiment_tool = SentimentTool(llm_client=mock_llm)
    service = EngagementService(
        lead_repo=lead_repo,
        conv_repo=conv_repo,
        msg_repo=msg_repo,
        platform_registry=registry,
        sentiment_tool=sentiment_tool,
    )
    service.reply_agent.llm = mock_llm

    payload = {
        "id": "li_evt_999",
        "author": {
            "id": "urn:li:person:sam_alt",
            "name": "Sam Altman",
            "headline": "CEO at Tech Company",
        },
        "text": "Can you share more info about your automated lead qualification engine?",
        "thread_id": "urn:li:activity:999",
        "type": "comment",
    }

    result = await service.ingest_event(platform="linkedin", raw_payload=payload)

    assert result["status"] == "success"
    assert result["reply"]["generated"] is True
    assert result["reply"]["requires_review"] is False

    # Verify conversation created in DB
    convs = await service.list_conversations()
    assert len(convs) >= 1
    assert convs[0].platform_thread_id == "urn:li:activity:999"


@pytest.mark.asyncio
async def test_engagement_service_review_flow(db_session: AsyncSession):
    lead_repo = LeadRepository(db_session)
    conv_repo = ConversationRepository(db_session)
    msg_repo = MessageRepository(db_session)

    service = EngagementService(
        lead_repo=lead_repo,
        conv_repo=conv_repo,
        msg_repo=msg_repo,
    )

    lead = await lead_repo.create(platform="linkedin", platform_user_id="user_rev_flow", name="Review Lead")
    conv = await conv_repo.create(lead_id=lead.id, platform_thread_id="thread_rev_flow")

    msg = await msg_repo.create(
        conversation_id=conv.id,
        direction="outbound",
        content="Low confidence suggested reply",
        platform="linkedin",
        requires_review=True,
        review_status=ReviewStatus.PENDING.value,
    )

    # Check review queue
    queue = await service.get_review_queue()
    assert any(m.id == msg.id for m in queue)

    # Approve message
    approved = await service.approve_reply(msg.id)
    assert approved.review_status == ReviewStatus.APPROVED.value
    assert approved.requires_review is False

from unittest.mock import AsyncMock
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.reply_agent import ReplyAgent
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.tools.ai.llm_client import LLMResponse
from app.tools.ai.rag_tool import RAGResult


@pytest.mark.asyncio
async def test_reply_agent_high_confidence(db_session: AsyncSession):
    lead_repo = LeadRepository(db_session)
    conv_repo = ConversationRepository(db_session)
    msg_repo = MessageRepository(db_session)

    lead = await lead_repo.create(platform="linkedin", platform_user_id="user_123", name="Alex Rivera")
    conv = await conv_repo.create(lead_id=lead.id, platform_thread_id="thread_123")

    mock_llm = AsyncMock()
    mock_llm.generate.return_value = LLMResponse(
        text="Hi Alex! VibeAgent offers flexible tiers with dedicated self-hosted LLM inference for enterprise teams.",
        model="llama3.1:8b",
        tokens_used=60,
        latency_ms=250,
    )

    mock_rag = AsyncMock()
    mock_rag.retrieve_context.return_value = RAGResult(
        documents=[{"id": "doc_pricing", "title": "Pricing", "content": "Self-hosted tiers", "doc_type": "faq", "similarity": 0.90}],
        formatted_text="[FAQ] Pricing: Self-hosted tiers",
        top_score=0.90,
    )

    agent = ReplyAgent(
        message_repo=msg_repo,
        llm_client=mock_llm,
        rag_tool=mock_rag,
    )

    result = await agent.generate_reply(
        conversation_id=conv.id,
        incoming_message="What enterprise deployment options do you have?",
        platform="linkedin",
        lead_name=lead.name,
        sentiment="neutral",
    )

    assert result.success is True
    assert result.confidence_score >= 0.85
    assert result.requires_review is False
    assert "Hi Alex!" in result.data["reply_text"]

    # Verify message in DB
    messages = await msg_repo.get_messages_for_conversation(conv.id)
    assert len(messages) == 1
    assert messages[0].direction == "outbound"
    assert messages[0].review_status == "approved"


@pytest.mark.asyncio
async def test_reply_agent_negative_sentiment_triggers_review(db_session: AsyncSession):
    lead_repo = LeadRepository(db_session)
    conv_repo = ConversationRepository(db_session)
    msg_repo = MessageRepository(db_session)

    lead = await lead_repo.create(platform="linkedin", platform_user_id="user_456", name="Angry User")
    conv = await conv_repo.create(lead_id=lead.id, platform_thread_id="thread_456")

    mock_llm = AsyncMock()
    mock_llm.generate.return_value = LLMResponse(
        text="We apologize for the inconvenience and will have a customer success lead connect with you directly.",
        model="llama3.1:8b",
        tokens_used=40,
        latency_ms=200,
    )

    agent = ReplyAgent(message_repo=msg_repo, llm_client=mock_llm)

    result = await agent.generate_reply(
        conversation_id=conv.id,
        incoming_message="Your integration broke our webhook stream yesterday!",
        platform="linkedin",
        lead_name=lead.name,
        sentiment="negative",
    )

    assert result.success is True
    assert result.requires_review is True
    assert result.data["review_status"] == "pending"

    # Verify in review queue
    review_queue = await msg_repo.get_review_queue()
    assert len(review_queue) >= 1
    assert any(m.id.__class__(result.data["message_id"]) == m.id for m in review_queue)

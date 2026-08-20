from unittest.mock import AsyncMock
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.monitor import MonitorAgent
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.tools.ai.sentiment_tool import SentimentResult, SentimentTool
from app.tools.utils.event_normalizer import NormalizedEvent


@pytest.mark.asyncio
async def test_monitor_agent_process_event(db_session: AsyncSession):
    lead_repo = LeadRepository(db_session)
    conv_repo = ConversationRepository(db_session)
    msg_repo = MessageRepository(db_session)

    mock_sentiment = AsyncMock(spec=SentimentTool)
    mock_sentiment.analyze.return_value = SentimentResult(label="positive", score=0.85)

    agent = MonitorAgent(
        lead_repo=lead_repo,
        conversation_repo=conv_repo,
        message_repo=msg_repo,
        sentiment_tool=mock_sentiment,
    )

    event = NormalizedEvent(
        platform="linkedin",
        event_type="comment",
        event_id="evt_001",
        thread_id="urn:li:share:112233",
        author_id="urn:li:person:buyer1",
        author_name="Jane Doe",
        author_headline="CTO at CloudScale",
        content="We are looking for an AI marketing tool that handles automated qualification. What is pricing?",
    )

    res = await agent.process_event(event)

    assert res.success is True
    assert res.data["requires_reply"] is True
    assert res.data["sentiment"] == "positive"

    # Verify database state
    lead = await lead_repo.get_by_platform_user("linkedin", "urn:li:person:buyer1")
    assert lead is not None
    assert lead.name == "Jane Doe"
    assert lead.job_title == "CTO at CloudScale"

    conv = await conv_repo.get_by_lead_and_thread(lead.id, "urn:li:share:112233")
    assert conv is not None

    messages = await msg_repo.get_messages_for_conversation(conv.id)
    assert len(messages) == 1
    assert messages[0].sentiment == "positive"
    assert "automated qualification" in messages[0].content

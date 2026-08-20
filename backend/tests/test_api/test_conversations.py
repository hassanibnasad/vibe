import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository


@pytest.mark.asyncio
async def test_review_queue_approve_and_reject(client: AsyncClient, db_session: AsyncSession):
    lead_repo = LeadRepository(db_session)
    conv_repo = ConversationRepository(db_session)
    msg_repo = MessageRepository(db_session)

    lead = await lead_repo.create(platform="linkedin", platform_user_id="lead_rev_1", name="Review Target")
    conv = await conv_repo.create(lead_id=lead.id, platform_thread_id="thread_rev_1")

    # Create message requiring review
    msg = await msg_repo.create(
        conversation_id=conv.id,
        direction="outbound",
        content="AI generated proposed reply awaiting review",
        platform="linkedin",
        requires_review=True,
        review_status="pending",
        confidence_score=0.65,
    )
    await db_session.commit()

    # 1. Check Review Queue
    queue_res = await client.get("/api/v1/conversations/review-queue")
    assert queue_res.status_code == 200
    queue_items = queue_res.json()
    assert len(queue_items) >= 1
    assert any(item["message_id"] == str(msg.id) for item in queue_items)

    # 2. Approve reply
    approve_res = await client.post(f"/api/v1/conversations/review-queue/{msg.id}/approve")
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # 3. Create second message for rejection / edit test
    msg2 = await msg_repo.create(
        conversation_id=conv.id,
        direction="outbound",
        content="Another pending reply",
        platform="linkedin",
        requires_review=True,
        review_status="pending",
    )
    await db_session.commit()

    reject_res = await client.post(
        f"/api/v1/conversations/review-queue/{msg2.id}/reject",
        json={"alternative_reply": "Custom operator corrected reply text."},
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "edited"

from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_conversation_repo, get_message_repo
from app.exceptions import ConversationNotFoundError, NotFoundError
from app.middleware.auth import get_current_user
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.message_repo import MessageRepository
from app.schemas.conversation import (
    ConversationResponse,
    MessageCreateRequest,
    MessageResponse,
    ReviewActionRequest,
    ReviewItemResponse,
)

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    lead_id: UUID | None = Query(None),
    conv_repo: ConversationRepository = Depends(get_conversation_repo),
    current_user: dict = Depends(get_current_user),
) -> list[ConversationResponse]:
    if lead_id:
        convs = await conv_repo.get_active_by_lead(lead_id)
    else:
        convs = await conv_repo.get_all(limit=50)
    return [ConversationResponse.model_validate(c) for c in convs]


@router.get("/review-queue", response_model=list[ReviewItemResponse])
async def get_review_queue(
    msg_repo: MessageRepository = Depends(get_message_repo),
    current_user: dict = Depends(get_current_user),
) -> list[ReviewItemResponse]:
    messages = await msg_repo.get_review_queue(limit=50)
    return [
        ReviewItemResponse(
            message_id=m.id,
            conversation_id=m.conversation_id,
            lead_id=m.conversation.lead_id if m.conversation else m.id,
            platform=m.platform,
            suggested_reply=m.content,
            confidence_score=m.confidence_score,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.post("/review-queue/{message_id}/approve", status_code=status.HTTP_200_OK)
async def approve_reply(
    message_id: UUID,
    msg_repo: MessageRepository = Depends(get_message_repo),
    current_user: dict = Depends(get_current_user),
) -> dict:
    message = await msg_repo.get_by_id(message_id)
    if not message:
        raise NotFoundError(f"Message {message_id} not found")

    await msg_repo.update(
        message_id,
        review_status="approved",
        requires_review=False,
    )
    return {"status": "approved", "message_id": str(message_id)}


@router.post("/review-queue/{message_id}/reject", status_code=status.HTTP_200_OK)
async def reject_reply(
    message_id: UUID,
    data: ReviewActionRequest,
    msg_repo: MessageRepository = Depends(get_message_repo),
    current_user: dict = Depends(get_current_user),
) -> dict:
    message = await msg_repo.get_by_id(message_id)
    if not message:
        raise NotFoundError(f"Message {message_id} not found")

    update_payload: dict = {
        "review_status": "rejected",
        "requires_review": False,
    }
    if data.alternative_reply:
        update_payload["original_content"] = message.content
        update_payload["content"] = data.alternative_reply
        update_payload["review_status"] = "edited"

    await msg_repo.update(message_id, **update_payload)
    return {"status": update_payload["review_status"], "message_id": str(message_id)}


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: UUID,
    msg_repo: MessageRepository = Depends(get_message_repo),
    current_user: dict = Depends(get_current_user),
) -> list[MessageResponse]:
    messages = await msg_repo.get_messages_for_conversation(conversation_id)
    return [MessageResponse.model_validate(m) for m in messages]


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_manual_message(
    conversation_id: UUID,
    data: MessageCreateRequest,
    conv_repo: ConversationRepository = Depends(get_conversation_repo),
    msg_repo: MessageRepository = Depends(get_message_repo),
    current_user: dict = Depends(get_current_user),
) -> MessageResponse:
    conv = await conv_repo.get_by_id(conversation_id)
    if not conv:
        raise ConversationNotFoundError(f"Conversation {conversation_id} not found")

    message = await msg_repo.create(
        conversation_id=conversation_id,
        direction="outbound",
        content=data.content,
        media_urls=data.media_urls,
        platform=conv.platform.name if conv.platform else "linkedin",
        review_status="approved",
    )
    return MessageResponse.model_validate(message)

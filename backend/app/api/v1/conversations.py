from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_engagement_service
from app.middleware.auth import get_current_user
from app.schemas.conversation import (
    ConversationResponse,
    MessageCreateRequest,
    MessageResponse,
    ReviewActionRequest,
    ReviewItemResponse,
)
from app.services.engagement_service import EngagementService

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    lead_id: UUID | None = Query(None),
    engagement_service: EngagementService = Depends(get_engagement_service),
    current_user: dict = Depends(get_current_user),
) -> list[ConversationResponse]:
    convs = await engagement_service.list_conversations(lead_id=lead_id)
    return [ConversationResponse.model_validate(c) for c in convs]


@router.get("/review-queue", response_model=list[ReviewItemResponse])
async def get_review_queue(
    engagement_service: EngagementService = Depends(get_engagement_service),
    current_user: dict = Depends(get_current_user),
) -> list[ReviewItemResponse]:
    messages = await engagement_service.get_review_queue(limit=50)
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
    engagement_service: EngagementService = Depends(get_engagement_service),
    current_user: dict = Depends(get_current_user),
) -> dict:
    await engagement_service.approve_reply(message_id)
    return {"status": "approved", "message_id": str(message_id)}


@router.post("/review-queue/{message_id}/reject", status_code=status.HTTP_200_OK)
async def reject_reply(
    message_id: UUID,
    data: ReviewActionRequest,
    engagement_service: EngagementService = Depends(get_engagement_service),
    current_user: dict = Depends(get_current_user),
) -> dict:
    updated = await engagement_service.reject_or_edit_reply(
        message_id=message_id,
        alternative_reply=data.alternative_reply,
    )
    return {"status": updated.review_status, "message_id": str(message_id)}


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: UUID,
    engagement_service: EngagementService = Depends(get_engagement_service),
    current_user: dict = Depends(get_current_user),
) -> list[MessageResponse]:
    messages = await engagement_service.get_messages(conversation_id)
    return [MessageResponse.model_validate(m) for m in messages]


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_manual_message(
    conversation_id: UUID,
    data: MessageCreateRequest,
    engagement_service: EngagementService = Depends(get_engagement_service),
    current_user: dict = Depends(get_current_user),
) -> MessageResponse:
    message = await engagement_service.send_manual_message(
        conversation_id=conversation_id,
        content=data.content,
        media_urls=data.media_urls,
    )
    return MessageResponse.model_validate(message)

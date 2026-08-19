from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    direction: str
    content: str
    content_type: str = "text"
    media_urls: list[str] = []
    platform: str
    sentiment: str | None = None
    sentiment_score: float | None = None
    confidence_score: float | None = None
    requires_review: bool = False
    review_status: str | None = None
    created_at: datetime


class MessageCreateRequest(BaseModel):
    content: str = Field(..., min_length=1)
    media_urls: list[str] = []


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lead_id: UUID
    platform_id: UUID | None = None
    platform_thread_id: str | None = None
    status: str
    topic: str | None = None
    total_messages: int = 0
    last_message_at: datetime | None = None
    created_at: datetime


class ReviewItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message_id: UUID
    conversation_id: UUID
    lead_id: UUID
    platform: str
    suggested_reply: str
    confidence_score: float | None = None
    created_at: datetime


class ReviewActionRequest(BaseModel):
    alternative_reply: str | None = None

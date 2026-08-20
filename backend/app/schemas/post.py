from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PostGenerateRequest(BaseModel):
    brief: str = Field(..., min_length=5, description="Topic or brief for AI content generation")
    platforms: list[str] = Field(default=["linkedin"], min_length=1)
    campaign_id: UUID | None = None
    tone: str = "professional"
    variants: int = Field(default=1, ge=1, le=5)


class PostCreateRequest(BaseModel):
    campaign_id: UUID | None = None
    platform_id: UUID | None = None
    content: str = Field(..., min_length=1)
    media_urls: list[str] = []
    hashtags: list[str] = []
    cta: str | None = None
    scheduled_at: datetime | None = None


class PostUpdateRequest(BaseModel):
    content: str | None = None
    media_urls: list[str] | None = None
    hashtags: list[str] | None = None
    cta: str | None = None
    scheduled_at: datetime | None = None
    status: str | None = None


class PostPublishRequest(BaseModel):
    scheduled_at: datetime | None = None


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    campaign_id: UUID | None = None
    platform_id: UUID | None = None
    content: str
    media_urls: list[str] = []
    hashtags: list[str] = []
    cta: str | None = None
    platform_post_id: str | None = None
    platform_post_url: str | None = None
    status: str
    error_message: str | None = None
    scheduled_at: datetime | None = None
    published_at: datetime | None = None
    engagement_metrics: dict = {}
    variant_label: str | None = None
    ai_generated: bool = False
    confidence_score: float | None = None
    requires_review: bool = False
    rag_sources: list[str] = []
    created_at: datetime


class PostListResponse(BaseModel):
    data: list[PostResponse]
    pagination: dict


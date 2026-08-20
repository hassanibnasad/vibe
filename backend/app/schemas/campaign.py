from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CampaignCreateRequest(BaseModel):
    name: str = Field(..., min_length=2)
    description: str | None = None
    brand_voice: str | None = None
    target_audience: str | None = None
    goals: list[str] = []
    starts_at: datetime | None = None
    ends_at: datetime | None = None


class CampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    brand_voice: str | None = None
    target_audience: str | None = None
    goals: list[str] = []
    status: str
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    created_at: datetime

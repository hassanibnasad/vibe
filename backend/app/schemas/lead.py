from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    platform: str
    platform_user_id: str
    platform_username: str | None = None
    platform_profile_url: str | None = None
    company: str | None = None
    job_title: str | None = None
    industry: str | None = None
    company_size: str | None = None
    lead_score: int = Field(ge=0, le=100)
    lead_stage: str
    tags: list[str] = []
    pain_points: list[str] = []
    interests: list[str] = []
    first_interaction_at: datetime
    last_interaction_at: datetime
    created_at: datetime


class LeadUpdateRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    job_title: str | None = None
    industry: str | None = None
    company_size: str | None = None
    lead_score: int | None = Field(None, ge=0, le=100)
    lead_stage: str | None = Field(None, pattern="^(cold|warm|hot|mql|sql)$")
    tags: list[str] | None = None


class LeadScoreUpdateRequest(BaseModel):
    new_score: int = Field(..., ge=0, le=100)
    reason: str = Field(..., min_length=3)


class LeadStageUpdateRequest(BaseModel):
    lead_stage: str = Field(..., pattern="^(cold|warm|hot|mql|sql|disqualified)$")
    reason: str | None = None



class LeadListResponse(BaseModel):
    data: list[LeadResponse]
    pagination: dict


class PipelineResponse(BaseModel):
    cold: int = 0
    warm: int = 0
    hot: int = 0
    mql: int = 0
    sql: int = 0

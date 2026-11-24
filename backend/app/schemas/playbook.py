from typing import Any
from pydantic import BaseModel, ConfigDict


class PlaybookStep(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    step_number: int
    title: str
    channel: str  # linkedin_dm, email, calendar_invite
    status: str  # pending, executed, skipped
    recommended_delay_days: int
    ai_draft_message: str
    executed_at: str | None = None


class NurturePlaybook(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    target_stage: str  # sql, mql, hot
    steps: list[PlaybookStep]


class PlaybookExecutionRequest(BaseModel):
    custom_message: str | None = None


class PlaybookExecutionResponse(BaseModel):
    playbook_id: str
    step_id: str
    status: str
    channel: str
    dispatched_at: str
    delivered_message: str

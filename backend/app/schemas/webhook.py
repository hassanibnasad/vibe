from typing import Any
from pydantic import BaseModel, Field


class WebhookPayload(BaseModel):
    platform: str
    event_type: str
    event_id: str | None = None
    user_id: str
    username: str | None = None
    message: str
    thread_id: str | None = None
    post_id: str | None = None
    raw: dict[str, Any] = Field(default_factory=dict)

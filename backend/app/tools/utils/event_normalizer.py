from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class NormalizedEvent(BaseModel):
    platform: str
    event_type: str  # comment, direct_message, mention, reaction
    event_id: str
    thread_id: str
    parent_id: str | None = None
    author_id: str
    author_name: str | None = None
    author_headline: str | None = None
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    raw_payload: dict[str, Any] = Field(default_factory=dict)


class EventNormalizer:
    """Normalizes vendor-specific webhook payloads into unified NormalizedEvent schemas."""

    @staticmethod
    def normalize_linkedin_comment(payload: dict[str, Any]) -> NormalizedEvent:
        """Parse LinkedIn Comment webhook payload (REST/UGC social action)."""
        event_id = payload.get("id") or payload.get("event_id") or f"li_evt_{datetime.now(UTC).timestamp()}"
        thread_id = (
            payload.get("thread_id")
            or payload.get("object")
            or payload.get("target_urn")
            or payload.get("parent_urn")
            or "urn:li:post:default"
        )
        parent_id = payload.get("parentComment") or payload.get("parent_comment_id")

        actor = payload.get("actor") or payload.get("author") or {}
        if isinstance(actor, dict):
            author_id = actor.get("id") or actor.get("urn") or "urn:li:person:anonymous"
            author_name = actor.get("name")
            author_headline = actor.get("headline")
        else:
            author_id = str(actor) or "urn:li:person:anonymous"
            author_name = payload.get("author_name")
            author_headline = payload.get("author_headline")

        message = payload.get("message")
        if isinstance(message, dict):
            content = message.get("text") or payload.get("text") or payload.get("content", "")
        elif isinstance(message, str):
            content = message
        else:
            content = payload.get("text") or payload.get("content") or ""

        return NormalizedEvent(
            platform="linkedin",
            event_type="comment",
            event_id=event_id,
            thread_id=thread_id,
            parent_id=parent_id,
            author_id=author_id,
            author_name=author_name,
            author_headline=author_headline,
            content=content or "",
            raw_payload=payload,
        )

    @staticmethod
    def normalize_generic(platform: str, payload: dict[str, Any]) -> NormalizedEvent:
        """Fallback normalizer for simulated or unstructured events."""
        event_id = payload.get("id") or payload.get("event_id") or f"{platform}_evt_{datetime.now(UTC).timestamp()}"
        thread_id = payload.get("thread_id") or payload.get("post_id") or "thread_default"
        author_id = payload.get("author_id") or payload.get("user_id") or f"{platform}_user_anon"
        content = payload.get("content") or payload.get("text") or payload.get("message", "")

        return NormalizedEvent(
            platform=platform.lower(),
            event_type=payload.get("type", "comment"),
            event_id=event_id,
            thread_id=thread_id,
            parent_id=payload.get("parent_id"),
            author_id=author_id,
            author_name=payload.get("author_name", "Prospective Lead"),
            author_headline=payload.get("author_headline"),
            content=content,
            raw_payload=payload,
        )

    @classmethod
    def normalize(cls, platform: str, payload: dict[str, Any]) -> NormalizedEvent:
        if platform.lower() == "linkedin":
            return cls.normalize_linkedin_comment(payload)
        return cls.normalize_generic(platform, payload)

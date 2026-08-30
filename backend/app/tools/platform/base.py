from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field


class PublishResult(BaseModel):
    success: bool
    platform_post_id: str | None = None
    platform_post_url: str | None = None
    error_message: str | None = None
    metadata_: dict[str, Any] = Field(default_factory=dict)


class SendResult(BaseModel):
    success: bool
    platform_message_id: str | None = None
    error_message: str | None = None
    metadata_: dict[str, Any] = Field(default_factory=dict)


class UserProfile(BaseModel):
    platform_user_id: str
    name: str | None = None
    headline: str | None = None
    profile_url: str | None = None
    avatar_url: str | None = None
    metadata_: dict[str, Any] = Field(default_factory=dict)


class BasePlatformTool(ABC):
    """Abstract base class for all social platform connectors."""

    @abstractmethod
    async def publish_post(
        self,
        content: str,
        media_urls: list[str] | None = None,
        hashtags: list[str] | None = None,
        cta: str | None = None,
    ) -> PublishResult:
        """Publish a post to the target platform."""
        pass

    @abstractmethod
    async def send_reply(
        self,
        thread_id: str,
        content: str,
        parent_comment_id: str | None = None,
    ) -> SendResult:
        """Send a reply to a comment or direct message."""
        pass

    @abstractmethod
    async def get_profile(self, user_id: str) -> UserProfile:
        """Fetch profile information for a platform user."""
        pass

from typing import TYPE_CHECKING, Any

import structlog

from app.exceptions import ValidationError
from app.models.enums import PlatformType
from app.tools.platform.base import BasePlatformTool
from app.tools.platform.linkedin_tool import LinkedInTool

if TYPE_CHECKING:
    from app.tools.utils.event_normalizer import NormalizedEvent

logger = structlog.get_logger()

DEFAULT_CONSTRAINTS: dict[str, dict[str, int]] = {
    PlatformType.LINKEDIN.value: {"max_chars": 3000, "max_hashtags": 10, "max_media": 9},
    PlatformType.TWITTER.value: {"max_chars": 280, "max_hashtags": 4, "max_media": 4},
    PlatformType.INSTAGRAM.value: {"max_chars": 2200, "max_hashtags": 30, "max_media": 10},
    PlatformType.THREADS.value: {"max_chars": 500, "max_hashtags": 5, "max_media": 10},
}


class PlatformRegistry:
    """Central registry and policy engine for multi-channel social platform connectors."""

    def __init__(
        self,
        tools: dict[str, BasePlatformTool] | None = None,
        constraints: dict[str, dict[str, int]] | None = None,
    ):
        self._tools: dict[str, BasePlatformTool] = tools or {
            PlatformType.LINKEDIN.value: LinkedInTool(),
        }
        self._constraints = constraints or DEFAULT_CONSTRAINTS.copy()

    def register(self, platform: str, tool: BasePlatformTool, constraints: dict[str, int] | None = None) -> None:
        """Register a new platform connector and optional constraint limits."""
        norm = platform.lower()
        self._tools[norm] = tool
        if constraints:
            self._constraints[norm] = constraints
        logger.info("platform_registered", platform=norm, tool_cls=tool.__class__.__name__)

    def get(self, platform: str) -> BasePlatformTool:
        """Retrieve the platform connector, falling back to LinkedIn tool if unspecified."""
        norm = platform.lower()
        if norm in self._tools:
            return self._tools[norm]
        # Fallback
        if PlatformType.LINKEDIN.value in self._tools:
            return self._tools[PlatformType.LINKEDIN.value]
        # Instantiate fallback
        fallback = LinkedInTool()
        self._tools[PlatformType.LINKEDIN.value] = fallback
        return fallback

    def get_constraints(self, platform: str) -> dict[str, int]:
        norm = platform.lower()
        return self._constraints.get(
            norm,
            self._constraints.get(PlatformType.LINKEDIN.value, {"max_chars": 3000, "max_hashtags": 10, "max_media": 9}),
        )

    def validate_content(
        self,
        platform: str,
        content: str,
        hashtags: list[str] | None = None,
        media_urls: list[str] | None = None,
    ) -> None:
        """Enforce strict character and attachment limits per platform."""
        norm = platform.lower()
        constraints = self.get_constraints(norm)

        if not content or not content.strip():
            raise ValidationError("Post content cannot be empty.")

        if len(content) > constraints["max_chars"]:
            raise ValidationError(
                f"Content exceeds {norm} limit of {constraints['max_chars']} characters (got {len(content)})."
            )

        if hashtags and len(hashtags) > constraints["max_hashtags"]:
            raise ValidationError(
                f"Hashtags count exceeds {norm} limit of {constraints['max_hashtags']} (got {len(hashtags)})."
            )

        if media_urls and len(media_urls) > constraints["max_media"]:
            raise ValidationError(
                f"Media attachments count exceeds {norm} limit of {constraints['max_media']} (got {len(media_urls)})."
            )

    def normalize_event(self, platform: str, raw_payload: dict[str, Any]) -> "NormalizedEvent":
        """Normalize an inbound webhook event via the registered platform adapter."""
        from app.tools.utils.event_normalizer import EventNormalizer  # noqa: PLC0415
        norm = platform.lower()
        tool = self.get(norm)
        if hasattr(tool, "normalize_event"):
            return tool.normalize_event(raw_payload)
        return EventNormalizer.normalize(norm, raw_payload)


# Default global registry singleton
default_platform_registry = PlatformRegistry()

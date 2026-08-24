from typing import Any
import structlog

from app.agents.base import AgentResult, BaseAgent
from app.exceptions import ValidationError
from app.tools.platform.base import BasePlatformTool
from app.tools.platform.linkedin_tool import LinkedInTool
from app.tools.platform.registry import PlatformRegistry, default_platform_registry

logger = structlog.get_logger()


class PublisherAgent(BaseAgent):
    """Agent responsible for validating, formatting, and dispatching approved posts across platforms."""

    def __init__(
        self,
        platform_tools: dict[str, BasePlatformTool] | None = None,
        registry: PlatformRegistry | None = None,
        confidence_threshold: float = 0.90,
    ):
        super().__init__(name="PublisherAgent", confidence_threshold=confidence_threshold)
        if platform_tools:
            self.registry = PlatformRegistry(tools=platform_tools)
        elif registry:
            self.registry = registry
        else:
            self.registry = default_platform_registry
        self.platform_tools = self.registry._tools

    def validate_content(
        self,
        platform: str,
        content: str,
        hashtags: list[str] | None = None,
        media_urls: list[str] | None = None,
    ) -> None:
        self.registry.validate_content(
            platform=platform,
            content=content,
            hashtags=hashtags,
            media_urls=media_urls,
        )


    async def publish_post(
        self,
        platform: str,
        content: str,
        media_urls: list[str] | None = None,
        hashtags: list[str] | None = None,
        cta: str | None = None,
    ) -> AgentResult:
        self.logger.info("publisher_agent_dispatching", platform=platform, length=len(content))
        norm_platform = platform.lower()

        try:
            # 1. Constraint validation
            self.validate_content(
                platform=norm_platform,
                content=content,
                hashtags=hashtags,
                media_urls=media_urls,
            )

            # 2. Select platform connector tool
            tool = self.registry.get(norm_platform)

            # 3. Publish to social API
            result = await tool.publish_post(
                content=content,
                media_urls=media_urls,
                hashtags=hashtags,
                cta=cta,
            )

            if not result.success:
                return AgentResult(
                    success=False,
                    confidence_score=0.0,
                    requires_review=True,
                    data={"error": result.error_message},
                    reasoning=f"Platform dispatch failed: {result.error_message}",
                )

            return AgentResult(
                success=True,
                confidence_score=1.0,
                requires_review=False,
                data={
                    "platform": norm_platform,
                    "platform_post_id": result.platform_post_id,
                    "platform_post_url": result.platform_post_url,
                    "metadata": result.metadata_,
                },
                reasoning=f"Successfully dispatched to {norm_platform} via platform tool.",
            )

        except ValidationError as val_err:
            self.logger.warning("publisher_validation_failed", error=str(val_err))
            return AgentResult(
                success=False,
                confidence_score=0.0,
                requires_review=True,
                data={"error": str(val_err)},
                reasoning=f"Pre-publish validation error: {val_err}",
            )
        except Exception as exc:
            self.logger.error("publisher_agent_failed", error=str(exc))
            return AgentResult(
                success=False,
                confidence_score=0.0,
                requires_review=True,
                data={"error": str(exc)},
                reasoning=f"Publishing execution error: {exc}",
            )

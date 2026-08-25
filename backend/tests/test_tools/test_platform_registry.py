import pytest

from app.exceptions import ValidationError
from app.models.enums import PlatformType
from app.tools.platform.linkedin_tool import LinkedInTool
from app.tools.platform.registry import PlatformRegistry


def test_platform_registry_lookup():
    registry = PlatformRegistry()
    tool = registry.get("linkedin")
    assert isinstance(tool, LinkedInTool)

    # Fallback to default
    fallback = registry.get("unknown_platform")
    assert isinstance(fallback, LinkedInTool)


def test_platform_registry_validation_constraints():
    registry = PlatformRegistry()

    # Valid LinkedIn post
    registry.validate_content(
        platform="linkedin",
        content="Valid LinkedIn post",
        hashtags=["#AI", "#Tech"],
        media_urls=["https://example.com/img.jpg"],
    )

    # Exceeds Twitter character limit
    with pytest.raises(ValidationError) as exc:
        registry.validate_content(
            platform="twitter",
            content="a" * 300,
        )
    assert "Content exceeds twitter limit" in str(exc.value)

    # Empty content
    with pytest.raises(ValidationError) as exc_empty:
        registry.validate_content(platform="linkedin", content="   ")
    assert "cannot be empty" in str(exc_empty.value)

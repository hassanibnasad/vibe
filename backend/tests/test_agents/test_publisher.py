from unittest.mock import AsyncMock
import pytest

from app.agents.publisher import PublisherAgent
from app.tools.platform.base import PublishResult


@pytest.mark.asyncio
async def test_publisher_agent_success():
    mock_tool = AsyncMock()
    mock_tool.publish_post.return_value = PublishResult(
        success=True,
        platform_post_id="urn:li:share:123456",
        platform_post_url="https://www.linkedin.com/feed/update/urn:li:share:123456/",
    )

    agent = PublisherAgent(platform_tools={"linkedin": mock_tool})
    result = await agent.publish_post(
        platform="linkedin",
        content="Exciting updates from the product team!",
        hashtags=["#Product", "#AI"],
    )

    assert result.success is True
    assert result.confidence_score == 1.0
    assert result.data["platform_post_id"] == "urn:li:share:123456"
    assert result.data["platform"] == "linkedin"
    mock_tool.publish_post.assert_awaited_once()


@pytest.mark.asyncio
async def test_publisher_agent_validation_empty_content():
    agent = PublisherAgent()
    result = await agent.publish_post(platform="linkedin", content="")
    assert result.success is False
    assert "cannot be empty" in result.data["error"]


@pytest.mark.asyncio
async def test_publisher_agent_validation_character_limit():
    agent = PublisherAgent()
    long_content = "X" * 3500
    result = await agent.publish_post(platform="linkedin", content=long_content)
    assert result.success is False
    assert "exceeds" in result.data["error"]

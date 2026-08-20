from unittest.mock import AsyncMock, MagicMock
import pytest

from app.exceptions import PlatformAPIError, RateLimitExceededError
from app.tools.platform.linkedin_tool import LinkedInTool
from app.tools.utils.rate_limiter import SlidingWindowRateLimiter


@pytest.mark.asyncio
async def test_linkedin_tool_simulation_mode():
    tool = LinkedInTool(access_token="mock_token", organization_id="12345")
    res = await tool.publish_post(
        content="Testing LinkedIn simulation mode",
        hashtags=["#AI", "#SaaS"],
        cta="Learn more",
    )
    assert res.success is True
    assert res.platform_post_id is not None
    assert "https://www.linkedin.com/feed/update/" in res.platform_post_url


@pytest.mark.asyncio
async def test_linkedin_tool_mocked_http_publish():
    mock_client = AsyncMock()
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.headers = {"x-restli-id": "urn:li:share:987654321"}
    mock_response.json.return_value = {"id": "urn:li:share:987654321"}
    mock_client.post.return_value = mock_response

    tool = LinkedInTool(
        access_token="live_token_abc",
        organization_id="12345",
        http_client=mock_client,
    )

    res = await tool.publish_post(
        content="Live post via LinkedIn Marketing API",
        hashtags=["#Growth"],
    )

    assert res.success is True
    assert res.platform_post_id == "urn:li:share:987654321"
    assert "987654321" in res.platform_post_url
    mock_client.post.assert_awaited_once()


@pytest.mark.asyncio
async def test_linkedin_tool_reply_and_profile():
    mock_client = AsyncMock()
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.headers = {"x-restli-id": "urn:li:comment:112233"}
    mock_response.json.return_value = {"id": "urn:li:comment:112233"}
    mock_client.post.return_value = mock_response

    tool = LinkedInTool(
        access_token="live_token_abc",
        organization_id="12345",
        http_client=mock_client,
    )

    res = await tool.send_reply(thread_id="urn:li:share:999", content="Thanks for the feedback!")
    assert res.success is True
    assert res.platform_message_id == "urn:li:comment:112233"


@pytest.mark.asyncio
async def test_linkedin_tool_rate_limiting():
    limiter = SlidingWindowRateLimiter(default_limit=2, window_seconds=60)
    tool = LinkedInTool(access_token="mock_token", rate_limiter=limiter, rate_limit=2)

    await tool.publish_post("Post 1")
    await tool.publish_post("Post 2")

    with pytest.raises(RateLimitExceededError):
        await tool.publish_post("Post 3 (exceeds limit)")

from typing import Any
import httpx
import structlog

from app.config import settings
from app.exceptions import PlatformAPIError
from app.tools.platform.base import BasePlatformTool, PublishResult, SendResult, UserProfile
from app.tools.utils.rate_limiter import SlidingWindowRateLimiter

logger = structlog.get_logger()


class LinkedInTool(BasePlatformTool):
    """Production-grade LinkedIn Marketing & Community Management API connector."""

    def __init__(
        self,
        access_token: str | None = None,
        organization_id: str | None = None,
        http_client: httpx.AsyncClient | None = None,
        rate_limiter: SlidingWindowRateLimiter | None = None,
        rate_limit: int = 20,
    ):
        self.access_token = access_token or settings.LINKEDIN_ACCESS_TOKEN
        self.organization_id = organization_id or settings.LINKEDIN_ORGANIZATION_ID
        self.http_client = http_client or httpx.AsyncClient(timeout=30.0)
        self.rate_limiter = rate_limiter or SlidingWindowRateLimiter(default_limit=100, window_seconds=60)
        self.rate_limit = rate_limit
        self.api_base = "https://api.linkedin.com"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": "202401",
        }

    def _author_urn(self) -> str:
        if self.organization_id:
            return f"urn:li:organization:{self.organization_id}"
        return "urn:li:person:me"

    async def publish_post(
        self,
        content: str,
        media_urls: list[str] | None = None,
        hashtags: list[str] | None = None,
        cta: str | None = None,
    ) -> PublishResult:
        """Publish a post to LinkedIn via the REST Posts API."""
        await self.rate_limiter.acquire("linkedin_publish", limit=self.rate_limit)

        # Assemble formatted text
        full_text = content.strip()
        if cta and cta not in full_text:
            full_text = f"{full_text}\n\n👉 {cta}"
        if hashtags:
            clean_tags = " ".join(t if t.startswith("#") else f"#{t}" for t in hashtags)
            full_text = f"{full_text}\n\n{clean_tags}"

        author = self._author_urn()
        payload: dict[str, Any] = {
            "author": author,
            "commentary": full_text,
            "visibility": "PUBLIC",
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": [],
            },
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": False,
        }

        # Media attachments if available
        if media_urls and len(media_urls) > 0:
            payload["content"] = {
                "media": [{"altText": "Post visual", "id": media_url} for media_url in media_urls[:1]]
            }

        # If running in mock/demo mode without active token, return simulated success
        if not self.access_token or self.access_token == "mock_token":
            mock_id = f"urn:li:share:sim_{hash(full_text) & 0xffffffff}"
            logger.info("linkedin_post_simulated", author=author, post_id=mock_id)
            return PublishResult(
                success=True,
                platform_post_id=mock_id,
                platform_post_url=f"https://www.linkedin.com/feed/update/{mock_id}/",
                metadata_={"mode": "simulated", "character_count": len(full_text)},
            )

        try:
            response = await self.http_client.post(
                f"{self.api_base}/rest/posts",
                headers=self._headers(),
                json=payload,
            )

            if response.status_code in (200, 201):
                try:
                    res_data = response.json() if callable(getattr(response, "json", None)) else {}
                except Exception:
                    res_data = {}
                post_id = response.headers.get("x-restli-id", res_data.get("id", ""))
                post_url = f"https://www.linkedin.com/feed/update/{post_id}/" if post_id else None
                return PublishResult(
                    success=True,
                    platform_post_id=post_id,
                    platform_post_url=post_url,
                    metadata_={"status_code": response.status_code},
                )
            else:
                error_msg = f"LinkedIn API returned {response.status_code}: {response.text}"
                logger.error("linkedin_publish_failed", error=error_msg)
                raise PlatformAPIError(error_msg)

        except Exception as exc:
            if isinstance(exc, PlatformAPIError):
                raise
            raise PlatformAPIError(f"LinkedIn publish network error: {exc}") from exc

    async def send_reply(
        self,
        thread_id: str,
        content: str,
        parent_comment_id: str | None = None,
    ) -> SendResult:
        """Send a reply to a comment thread on LinkedIn."""
        await self.rate_limiter.acquire("linkedin_reply", limit=self.rate_limit)

        author = self._author_urn()
        payload: dict[str, Any] = {
            "actor": author,
            "message": {"text": content.strip()},
        }
        if parent_comment_id:
            payload["parentComment"] = parent_comment_id

        if not self.access_token or self.access_token == "mock_token":
            mock_id = f"urn:li:comment:sim_{hash(content) & 0xffffffff}"
            logger.info("linkedin_reply_simulated", thread_id=thread_id, comment_id=mock_id)
            return SendResult(
                success=True,
                platform_message_id=mock_id,
                metadata_={"mode": "simulated", "thread_id": thread_id},
            )

        try:
            url = f"{self.api_base}/rest/socialActions/{thread_id}/comments"
            response = await self.http_client.post(
                url,
                headers=self._headers(),
                json=payload,
            )

            if response.status_code in (200, 201):
                try:
                    res_data = response.json() if callable(getattr(response, "json", None)) else {}
                except Exception:
                    res_data = {}
                comment_id = response.headers.get("x-restli-id", res_data.get("id", ""))
                return SendResult(
                    success=True,
                    platform_message_id=comment_id,
                    metadata_={"status_code": response.status_code},
                )
            else:
                error_msg = f"LinkedIn reply failed with {response.status_code}: {response.text}"
                logger.error("linkedin_reply_failed", error=error_msg)
                raise PlatformAPIError(error_msg)

        except Exception as exc:
            if isinstance(exc, PlatformAPIError):
                raise
            raise PlatformAPIError(f"LinkedIn reply network error: {exc}") from exc

    async def get_profile(self, user_id: str) -> UserProfile:
        """Retrieve profile information for a LinkedIn author/user."""
        await self.rate_limiter.acquire("linkedin_profile", limit=self.rate_limit)

        if not self.access_token or self.access_token == "mock_token":
            return UserProfile(
                platform_user_id=user_id,
                name="LinkedIn Professional",
                headline="Decision Maker at Tech Enterprise",
                profile_url=f"https://www.linkedin.com/in/{user_id}",
                metadata_={"mode": "simulated"},
            )

        try:
            response = await self.http_client.get(
                f"{self.api_base}/v2/userinfo",
                headers={"Authorization": f"Bearer {self.access_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                return UserProfile(
                    platform_user_id=data.get("sub", user_id),
                    name=data.get("name", "Unknown User"),
                    headline=data.get("headline"),
                    profile_url=f"https://www.linkedin.com/in/{user_id}",
                    avatar_url=data.get("picture"),
                    metadata_=data,
                )
            return UserProfile(platform_user_id=user_id, name="LinkedIn Member")
        except Exception as exc:
            logger.warning("linkedin_profile_lookup_failed", error=str(exc))
            return UserProfile(platform_user_id=user_id, name="LinkedIn Member")

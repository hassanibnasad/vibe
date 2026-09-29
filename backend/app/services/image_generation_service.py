"""Image generation service backed by Together AI (Flux-Schnell) or Pollinations.

Provider selection is driven by ``settings.IMAGE_GEN_PROVIDER``:
  - ``"together"``     — Together AI Flux-Schnell-Free (free tier, high quality).
  - ``"pollinations"`` — Pollinations.ai (no key, completely free, HTTP only).
  - ``""``             — Disabled; callers receive an empty list.

Returns a list of ``ImageResult`` objects each containing the image URL and
optional local path (when the image is downloaded to RustFS or disk).
"""

from __future__ import annotations

from urllib.parse import quote

import httpx
import structlog
from pydantic import BaseModel

from app.config import settings

logger = structlog.get_logger()


class ImageResult(BaseModel):
    url: str
    prompt: str
    width: int
    height: int
    provider: str


class ImageGenerationService:
    """Thin, provider-agnostic wrapper for text-to-image generation."""

    async def generate(
        self,
        prompt: str,
        *,
        width: int | None = None,
        height: int | None = None,
        n: int = 1,
    ) -> list[ImageResult]:
        """Generate *n* images for *prompt*.  Returns an empty list when disabled."""
        provider = settings.IMAGE_GEN_PROVIDER.lower()
        w = width or settings.IMAGE_GEN_WIDTH
        h = height or settings.IMAGE_GEN_HEIGHT

        if not provider:
            logger.info("image_gen.disabled")
            return []

        if provider == "together":
            return await self._together(prompt, w, h, n)
        if provider == "pollinations":
            return self._pollinations(prompt, w, h, n)

        logger.warning("image_gen.unknown_provider", provider=provider)
        return []

    # ── Together AI ────────────────────────────────────────────────────────────

    async def _together(
        self, prompt: str, width: int, height: int, n: int
    ) -> list[ImageResult]:
        if not settings.TOGETHER_API_KEY:
            logger.warning("image_gen.together.missing_api_key")
            return []

        results: list[ImageResult] = []
        async with httpx.AsyncClient(timeout=60.0) as client:
            for _ in range(n):
                resp = await client.post(
                    "https://api.together.xyz/v1/images/generations",
                    headers={
                        "Authorization": f"Bearer {settings.TOGETHER_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.IMAGE_GEN_MODEL,
                        "prompt": prompt,
                        "width": width,
                        "height": height,
                        "steps": settings.IMAGE_GEN_STEPS,
                        "n": 1,
                        "response_format": "url",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                for item in data.get("data", []):
                    url = item.get("url", "")
                    if url:
                        results.append(
                            ImageResult(
                                url=url,
                                prompt=prompt,
                                width=width,
                                height=height,
                                provider="together",
                            )
                        )
        logger.info("image_gen.together.generated", count=len(results), model=settings.IMAGE_GEN_MODEL)
        return results

    # ── Pollinations ───────────────────────────────────────────────────────────

    def _pollinations(
        self, prompt: str, width: int, height: int, n: int
    ) -> list[ImageResult]:
        """Pollinations uses a simple URL convention — no HTTP call needed."""
        encoded = quote(prompt)
        return [
            ImageResult(
                url=f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&seed={i}&nologo=true",
                prompt=prompt,
                width=width,
                height=height,
                provider="pollinations",
            )
            for i in range(n)
        ]

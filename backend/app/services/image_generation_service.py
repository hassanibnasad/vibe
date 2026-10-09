"""Image generation service backed by Hugging Face Spaces (FLUX.1-schnell), Together AI, or Pollinations.

Provider selection is driven by ``settings.IMAGE_GEN_PROVIDER``:
  - ``"huggingface"``  — Hugging Face Space black-forest-labs/FLUX.1-schnell.
  - ``"together"``     — Together AI Flux-Schnell-Free (free tier, high quality).
  - ``"pollinations"`` — Pollinations.ai (zero-key fallback, FLUX architecture).
  - ``""``             — Disabled; callers receive an empty list.

Returns a list of ``ImageResult`` objects each containing the image URL and
optional local path (when the image is downloaded to disk).
"""

from __future__ import annotations

import asyncio
import os
import shutil
from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

import httpx
import structlog
from pydantic import BaseModel

from app.config import settings

logger = structlog.get_logger()

MEDIA_DIR = Path(__file__).resolve().parent.parent.parent / ".scratch" / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)


class ImageResult(BaseModel):
    url: str
    prompt: str
    width: int
    height: int
    provider: str
    local_path: str | None = None


ASPECT_RATIOS: dict[str, tuple[int, int]] = {
    "1:1": (1024, 1024),
    "16:9": (1280, 720),
    "4:5": (1024, 1280),
    "9:16": (720, 1280),
    "3:2": (1200, 800),
}


class ImageGenerationService:
    """Thin, provider-agnostic wrapper for text-to-image generation."""

    def resolve_dimensions(
        self,
        width: int | None = None,
        height: int | None = None,
        aspect_ratio: str | None = None,
    ) -> tuple[int, int]:
        """Resolve width and height from explicit values, aspect ratio, or defaults."""
        if width and height:
            return width, height
        if aspect_ratio and aspect_ratio in ASPECT_RATIOS:
            return ASPECT_RATIOS[aspect_ratio]
        return settings.IMAGE_GEN_WIDTH, settings.IMAGE_GEN_HEIGHT

    def build_brand_image_prompt(
        self,
        base_prompt: str,
        brand_profile: dict | None = None,
        style_preset: str | None = None,
    ) -> str:
        """Compose a prompt with brand visual tokens and stylistic enhancements."""
        parts = [base_prompt.strip()]

        if style_preset:
            presets = {
                "minimalist_3d": "Clean 3D isometric render, modern digital art, smooth lighting, octane render, 8k",
                "modern_vector": "Minimalist vector illustration, clean lines, high-contrast flat design, modern tech aesthetic",
                "dark_cyberpunk": "Dark mode futuristic UI aesthetic, neon accent lighting, high-tech enterprise glow",
                "editorial_photography": "Candid editorial photography, natural lighting, shallow depth of field, authentic corporate setting",
                "infographic": "Clean visual diagram graphic, clear architectural layout, modern infographic style",
            }
            if style_preset in presets:
                parts.append(presets[style_preset])

        if brand_profile:
            visual = brand_profile.get("visual_identity") or {}
            imagery_style = visual.get("imagery_style")
            if imagery_style:
                parts.append(f"Visual style: {imagery_style}")

            palette = visual.get("palette") or {}
            colors = [f"{k}: {v}" for k, v in palette.items() if v]
            if colors:
                parts.append(f"Brand color palette: {', '.join(colors)}")

        return ". ".join([p for p in parts if p]).strip()

    async def generate(
        self,
        prompt: str,
        *,
        width: int | None = None,
        height: int | None = None,
        aspect_ratio: str | None = None,
        n: int = 1,
        fallback_to_pollinations: bool = False,
    ) -> list[ImageResult]:
        """Generate *n* images for *prompt*. Returns an empty list when disabled."""
        provider = settings.IMAGE_GEN_PROVIDER.lower()
        w, h = self.resolve_dimensions(width, height, aspect_ratio)

        if not provider:
            logger.info("image_gen.disabled")
            return []

        if provider in ("huggingface", "hf_space", "spaces", "flux"):
            results = await self._huggingface_space(prompt, w, h, n)
            if not results and fallback_to_pollinations:
                logger.info("image_gen.hf_space_fallback_to_pollinations", prompt=prompt[:50])
                return self._pollinations(prompt, w, h, n)
            return results

        if provider == "together":
            results = await self._together(prompt, w, h, n)
            if not results and fallback_to_pollinations:
                logger.info("image_gen.together_fallback_to_pollinations", prompt=prompt[:50])
                return self._pollinations(prompt, w, h, n)
            return results

        if provider == "pollinations":
            return self._pollinations(prompt, w, h, n)

        if fallback_to_pollinations:
            logger.warning("image_gen.unknown_provider_fallback", provider=provider)
            return self._pollinations(prompt, w, h, n)

        logger.warning("image_gen.unknown_provider", provider=provider)
        return []

    # ── Hugging Face Space (FLUX.1-schnell) ────────────────────────────────────

    async def _huggingface_space(
        self, prompt: str, width: int, height: int, n: int
    ) -> list[ImageResult]:
        """Generate images via Hugging Face Space black-forest-labs/FLUX.1-schnell."""
        try:
            from gradio_client import Client
        except ImportError:
            logger.warning("image_gen.hf_space.missing_gradio_client")
            return []

        space_id = settings.IMAGE_GEN_SPACE_ID or "black-forest-labs/FLUX.1-schnell"
        hf_token = settings.HF_TOKEN or settings.HUGGINGFACE_API_KEY or None

        def _predict_one() -> tuple[str | None, str | None]:
            client = Client(space_id, hf_token=hf_token)
            result = client.predict(
                prompt=prompt,
                seed=0,
                randomize_seed=True,
                width=width,
                height=height,
                num_inference_steps=settings.IMAGE_GEN_STEPS or 4,
                api_name="/infer",
            )
            raw_image = result[0] if isinstance(result, tuple) and len(result) >= 1 else result

            img_path: str | None = None
            img_url: str | None = None

            if isinstance(raw_image, dict):
                img_path = raw_image.get("path")
                img_url = raw_image.get("url")
            elif isinstance(raw_image, (str, Path)):
                img_path = str(raw_image)

            saved_local_path: str | None = None
            final_url = img_url

            if img_path and os.path.exists(img_path):
                ext = os.path.splitext(img_path)[1] or ".webp"
                filename = f"flux_{uuid4().hex[:12]}{ext}"
                dest = MEDIA_DIR / filename
                shutil.copy2(img_path, dest)
                saved_local_path = str(dest)
                base_url = (
                    settings.BACKEND_BASE_URL.rstrip("/")
                    if settings.BACKEND_BASE_URL
                    else "http://localhost:8000"
                )
                final_url = f"{base_url}/media/{filename}"

            return final_url, saved_local_path

        results: list[ImageResult] = []
        for _ in range(n):
            try:
                final_url, saved_local_path = await asyncio.to_thread(_predict_one)
                if final_url:
                    results.append(
                        ImageResult(
                            url=final_url,
                            prompt=prompt,
                            width=width,
                            height=height,
                            provider="huggingface-flux-schnell",
                            local_path=saved_local_path,
                        )
                    )
            except Exception as exc:
                logger.warning(
                    "image_gen.hf_space.item_failed",
                    error=str(exc),
                    space=space_id,
                    authenticated=bool(hf_token),
                )
                break

        if results:
            logger.info("image_gen.hf_space.generated", count=len(results), space=space_id)
        return results

    # ── Together AI ────────────────────────────────────────────────────────────

    async def _together(
        self, prompt: str, width: int, height: int, n: int
    ) -> list[ImageResult]:
        if not settings.TOGETHER_API_KEY:
            logger.warning("image_gen.together.missing_api_key")
            return []

        results: list[ImageResult] = []
        try:
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
        except Exception as exc:
            logger.error("image_gen.together.failed", error=str(exc))
            return []

    # ── Pollinations ───────────────────────────────────────────────────────────

    def _pollinations(
        self, prompt: str, width: int, height: int, n: int
    ) -> list[ImageResult]:
        """Pollinations uses a simple URL convention — no HTTP call needed."""
        encoded = quote(prompt)
        use_flux = "flux" in settings.IMAGE_GEN_MODEL.lower()
        model_param = "&model=flux" if use_flux else ""
        return [
            ImageResult(
                url=f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}{model_param}&seed={i}&nologo=true",
                prompt=prompt,
                width=width,
                height=height,
                provider="pollinations",
            )
            for i in range(n)
        ]


"""
BrandSynthesisService — orchestrate parallel Text + Vision LLM calls to
synthesise a BrandProfile from scraped website data.

Design:
  - Fires two concurrent ``asyncio.gather()`` calls when a screenshot is
    available; falls back to text-only extraction otherwise.
  - Uses ``LLMClient.generate_structured()`` for the text analysis and
    raw ``litellm.acompletion()`` for the vision call (multimodal message).
  - Merges results into a flat dict ready for ``BrandProfileRepository.upsert()``.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

import structlog
from jinja2 import Environment, FileSystemLoader
from pydantic import BaseModel

from app.config import settings
from app.tools.ai.llm_client import LLMClient

logger = structlog.get_logger()


# ── Pydantic schemas for structured LLM extraction ──────────────────────────


class WrittenIdentity(BaseModel):
    archetype: str = "Professional"
    tone_attributes: list[str] = []
    banned_words: list[str] = []
    formatting_rules: str = ""


class ConversionAssets(BaseModel):
    lead_magnets: list[str] = []
    cta_templates: list[str] = []
    offer_hooks: list[str] = []


class ICPPainPoint(BaseModel):
    feature: str
    pain_hook: str
    target_persona: str = ""


class TextAnalysisResult(BaseModel):
    tagline: str = ""
    written_identity: WrittenIdentity = WrittenIdentity()
    core_value_props: list[str] = []
    conversion_assets: ConversionAssets = ConversionAssets()
    icp_pain_points: list[ICPPainPoint] = []


class VisualIdentity(BaseModel):
    aesthetic_summary: str = ""
    imagery_style: str = ""
    palette: dict[str, Any] = {}
    typography_style: str = ""
    negative_prompts: str = ""
    logo_description: str = ""


# ── Service ──────────────────────────────────────────────────────────────────


class BrandSynthesisService:
    """Orchestrate parallel Text + Vision LLM calls to synthesise a BrandProfile."""

    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self._llm = llm_client or LLMClient()

        prompt_dir = Path(__file__).parent.parent / "prompts"
        self._jinja = Environment(
            loader=FileSystemLoader(str(prompt_dir)), autoescape=False
        )

    async def synthesize(
        self,
        markdown: str,
        screenshot_b64: str | None,
        url: str,
        brand_name: str = "",
    ) -> dict[str, Any]:
        """Run text + vision analysis and return a merged dict for BrandProfile upsert.

        Parameters
        ----------
        markdown:
            Clean markdown scraped from the client's website.
        screenshot_b64:
            Base64-encoded PNG screenshot, or ``None`` to skip vision analysis.
        url:
            The website URL (used in the text prompt for context).
        brand_name:
            The client's brand name.

        Returns
        -------
        dict:
            Flat dict with keys matching ``BrandProfile`` columns:
            ``tagline``, ``visual_identity``, ``written_identity``,
            ``core_value_props``, ``conversion_assets``, ``icp_pain_points``.
        """
        tasks: list[Any] = [self._analyze_text(markdown, url, brand_name)]

        if screenshot_b64 and settings.VISION_LLM_MODEL:
            tasks.append(self._analyze_screenshot(screenshot_b64))
        else:
            logger.info(
                "brand_synthesis.skipping_vision",
                reason="no screenshot" if not screenshot_b64 else "VISION_LLM_MODEL not configured",
            )

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Parse text result
        text_result: TextAnalysisResult
        if isinstance(results[0], Exception):
            logger.error("brand_synthesis.text_analysis_failed", error=str(results[0]))
            text_result = TextAnalysisResult()
        else:
            text_result = results[0]

        # Parse vision result
        visual_identity: dict[str, Any] = {}
        if len(results) > 1:
            if isinstance(results[1], Exception):
                logger.error("brand_synthesis.vision_analysis_failed", error=str(results[1]))
            else:
                visual_identity = results[1]

        # Merge into flat dict for BrandProfile upsert
        merged = {
            "brand_name": brand_name,
            "tagline": text_result.tagline,
            "written_identity": text_result.written_identity.model_dump(),
            "core_value_props": text_result.core_value_props,
            "conversion_assets": text_result.conversion_assets.model_dump(),
            "icp_pain_points": [p.model_dump() for p in text_result.icp_pain_points],
            "visual_identity": visual_identity,
        }

        logger.info(
            "brand_synthesis.complete",
            brand_name=brand_name,
            has_visual=bool(visual_identity),
            value_props_count=len(text_result.core_value_props),
            pain_points_count=len(text_result.icp_pain_points),
        )

        return merged

    # ── Internal ──────────────────────────────────────────────────────────────

    async def _analyze_text(
        self, markdown: str, url: str, brand_name: str
    ) -> TextAnalysisResult:
        """Extract written identity, value props, and conversion assets from text."""
        template = self._jinja.get_template("brand_synthesis.j2")
        prompt = template.render(
            brand_name=brand_name or "the company",
            website_url=url,
            scraped_markdown=markdown,
        )

        parsed, _response = await self._llm.generate_structured(
            prompt=prompt,
            schema=TextAnalysisResult,
            model="fast",
            temperature=0.2,
        )
        return parsed

    async def _analyze_screenshot(self, screenshot_b64: str) -> dict[str, Any]:
        """Extract visual identity from a website screenshot via Vision LLM."""
        import litellm  # noqa: PLC0415

        template = self._jinja.get_template("visual_analysis.j2")
        prompt_text = template.render()

        # Build multimodal message with base64 image
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_text},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{screenshot_b64}",
                        },
                    },
                ],
            }
        ]

        response = await litellm.acompletion(
            model=settings.VISION_LLM_MODEL,
            messages=messages,
            temperature=0.2,
            max_tokens=1024,
            response_format={"type": "json_object"},
        )

        raw_text = response.choices[0].message.content or "{}"
        # Strip markdown fences if present
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        visual_data = json.loads(raw_text.strip())

        logger.info(
            "brand_synthesis.vision_analysis_complete",
            model=settings.VISION_LLM_MODEL,
            has_palette="palette" in visual_data,
        )

        return visual_data

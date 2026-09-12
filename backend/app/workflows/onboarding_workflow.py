"""
Hatchet durable task: tenant-onboarding

Orchestrates the full brand extraction pipeline:
  1. Scrape the client's website (markdown + screenshot)
  2. Save screenshot to local staging
  3. Run parallel Text + Vision LLM synthesis
  4. Persist the synthesised BrandProfile
  5. Optionally chain into knowledge-ingestion for uploaded docs

Input contract:
  - ``website_url``: URL to scrape (e.g. "https://acme.ai")
  - ``brand_name``: Human-readable brand name
  - ``tenant_id``: UUID string of the owning tenant
"""

from __future__ import annotations

import base64
import datetime
import uuid
from datetime import UTC
from pathlib import Path

import structlog
from hatchet_sdk import Context
from pydantic import BaseModel

from app.hatchet_client import hatchet

logger = structlog.get_logger()


class OnboardingTaskInput(BaseModel):
    """Input schema for the tenant-onboarding Hatchet task."""

    website_url: str
    brand_name: str
    tenant_id: str


_LOCAL_STAGE_DIR = Path(".scratch/uploads")


@hatchet.task(
    name="tenant-onboarding",
    input_validator=OnboardingTaskInput,
    retries=2,
    execution_timeout=datetime.timedelta(minutes=5),
)
async def tenant_onboarding_task(
    input: OnboardingTaskInput,
    ctx: Context,
) -> dict:
    """
    1. Scrape website → markdown + screenshot
    2. Save screenshot to local staging
    3. BrandSynthesisService → text + vision LLM
    4. Persist BrandProfile via repository
    """
    from app.dependencies import get_sessionmaker  # noqa: PLC0415
    from app.repositories.brand_profile_repo import BrandProfileRepository  # noqa: PLC0415
    from app.services.brand_synthesis_service import BrandSynthesisService  # noqa: PLC0415
    from app.services.scraper_service import ScraperService  # noqa: PLC0415

    tenant_id = uuid.UUID(input.tenant_id)

    try:
        # ── Step 1: Scrape ────────────────────────────────────────────────────
        scraper = ScraperService()
        scrape_result = await scraper.scrape(input.website_url)

        if not scrape_result.success:
            logger.error(
                "tenant_onboarding.scrape_failed",
                url=input.website_url,
                error=scrape_result.error,
            )
            # Still persist the profile with failed status
            from sqlalchemy import text as sa_text  # noqa: PLC0415

            session_factory = get_sessionmaker()
            async with session_factory() as session:
                if session.bind and session.bind.dialect.name == "postgresql":
                    await session.execute(
                        sa_text("SELECT set_config('app.current_tenant', :tenant, true)"),
                        {"tenant": str(tenant_id)},
                    )
                repo = BrandProfileRepository(session)
                await repo.upsert(
                    tenant_id=tenant_id,
                    brand_name=input.brand_name,
                    website_url=input.website_url,
                    extraction_status="failed",
                )
                await session.commit()

            return {
                "status": "failed",
                "error": scrape_result.error,
                "brand_name": input.brand_name,
            }

        # ── Step 2: Save screenshot ───────────────────────────────────────────
        screenshot_url: str | None = None
        if scrape_result.screenshot_base64:
            screenshot_path = (
                _LOCAL_STAGE_DIR
                / f"brand_screenshots/{tenant_id}/{input.brand_name.replace(' ', '_')}.png"
            )
            screenshot_path.parent.mkdir(parents=True, exist_ok=True)
            screenshot_path.write_bytes(
                base64.b64decode(scrape_result.screenshot_base64)
            )
            screenshot_url = str(screenshot_path)
            logger.info(
                "tenant_onboarding.screenshot_saved",
                path=screenshot_url,
            )

        # ── Step 3: Synthesise via LLM ────────────────────────────────────────
        synthesiser = BrandSynthesisService()
        profile_data = await synthesiser.synthesize(
            markdown=scrape_result.markdown,
            screenshot_b64=scrape_result.screenshot_base64,
            url=input.website_url,
            brand_name=input.brand_name,
        )

        # ── Step 4: Persist ───────────────────────────────────────────────────
        from sqlalchemy import text as sa_text  # noqa: PLC0415

        session_factory = get_sessionmaker()
        async with session_factory() as session:
            if session.bind and session.bind.dialect.name == "postgresql":
                await session.execute(
                    sa_text("SELECT set_config('app.current_tenant', :tenant, true)"),
                    {"tenant": str(tenant_id)},
                )
            repo = BrandProfileRepository(session)
            await repo.upsert(
                tenant_id=tenant_id,
                brand_name=input.brand_name,
                website_url=input.website_url,
                tagline=profile_data.get("tagline", ""),
                visual_identity=profile_data.get("visual_identity", {}),
                written_identity=profile_data.get("written_identity", {}),
                core_value_props=profile_data.get("core_value_props", []),
                conversion_assets=profile_data.get("conversion_assets", {}),
                icp_pain_points=profile_data.get("icp_pain_points", []),
                extraction_status="complete",
                screenshot_url=screenshot_url,
                raw_scraped_markdown=scrape_result.markdown[:50000],  # cap storage
                last_extracted_at=datetime.datetime.now(UTC),
            )
            await session.commit()

        logger.info(
            "tenant_onboarding.complete",
            brand_name=input.brand_name,
            url=input.website_url,
            has_visual=bool(profile_data.get("visual_identity")),
            value_props=len(profile_data.get("core_value_props", [])),
        )

        return {
            "status": "complete",
            "brand_name": input.brand_name,
            "tagline": profile_data.get("tagline", ""),
            "value_props_count": len(profile_data.get("core_value_props", [])),
            "pain_points_count": len(profile_data.get("icp_pain_points", [])),
            "has_visual_identity": bool(profile_data.get("visual_identity")),
        }

    except Exception as exc:
        logger.error(
            "tenant_onboarding.error",
            brand_name=input.brand_name,
            url=input.website_url,
            error=str(exc),
        )
        return {
            "status": "failed",
            "brand_name": input.brand_name,
            "error": str(exc),
        }

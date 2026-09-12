"""
Onboarding API — /api/v1/onboarding

Endpoints:
  POST /extract-brand    Scrape website + synthesise BrandProfile → 202 Accepted
  GET  /brand-profile    Return the current tenant's BrandProfile
  PUT  /brand-profile    Manually update/override BrandProfile fields
"""

from __future__ import annotations

import uuid
from typing import Any
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_brand_profile_repo
from app.dependencies import DEFAULT_TENANT_ID
from app.middleware.auth import get_current_user
from app.repositories.brand_profile_repo import BrandProfileRepository

logger = structlog.get_logger()

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


# ── Request / Response schemas ────────────────────────────────────────────────


class ExtractBrandRequest(BaseModel):
    website_url: str
    brand_name: str


class ExtractBrandResponse(BaseModel):
    job_id: str
    brand_name: str
    website_url: str
    status: str = "queued"
    message: str


class BrandProfileResponse(BaseModel):
    id: uuid.UUID | str
    tenant_id: uuid.UUID | str
    brand_name: str
    website_url: str | None
    tagline: str | None
    visual_identity: dict
    written_identity: dict
    core_value_props: list
    conversion_assets: dict
    icp_pain_points: list
    extraction_status: str
    screenshot_url: str | None
    last_extracted_at: str | None

    model_config = {"from_attributes": True}


class BrandProfileUpdateRequest(BaseModel):
    brand_name: str | None = None
    tagline: str | None = None
    visual_identity: dict | None = None
    written_identity: dict | None = None
    core_value_props: list | None = None
    conversion_assets: dict | None = None
    icp_pain_points: list | None = None


def _get_tenant_id(current_user: Any) -> UUID:
    """Helper to extract tenant_id from auth user dict or fallback to default."""
    if isinstance(current_user, dict) and "tenant_id" in current_user:
        tid = current_user["tenant_id"]
        return tid if isinstance(tid, UUID) else UUID(str(tid))
    return DEFAULT_TENANT_ID


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post(
    "/extract-brand",
    response_model=ExtractBrandResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Scrape website and synthesise brand identity",
)
async def extract_brand(
    body: ExtractBrandRequest,
    current_user: dict = Depends(get_current_user),
) -> ExtractBrandResponse:
    """
    Dispatch a Hatchet ``tenant-onboarding`` background task that:
    1. Scrapes the website (Crawl4AI / HTTP fallback)
    2. Runs parallel Text + Vision LLM synthesis
    3. Persists the BrandProfile

    Returns ``202 Accepted`` immediately.
    """
    from app.workflows.onboarding_workflow import (  # noqa: PLC0415
        OnboardingTaskInput,
        tenant_onboarding_task,
    )

    stage_id = uuid.uuid4()
    tenant_id = _get_tenant_id(current_user)

    job_ref = await tenant_onboarding_task.aio_run_no_wait(
        OnboardingTaskInput(
            website_url=body.website_url,
            brand_name=body.brand_name,
            tenant_id=str(tenant_id),
        )
    )

    job_id = str(getattr(job_ref, "workflow_run_id", stage_id))

    logger.info(
        "onboarding.extract_brand.accepted",
        brand_name=body.brand_name,
        url=body.website_url,
        job_id=job_id,
        tenant_id=str(tenant_id),
    )

    return ExtractBrandResponse(
        job_id=job_id,
        brand_name=body.brand_name,
        website_url=body.website_url,
        status="queued",
        message="Brand extraction job dispatched. Profile will be available once the job completes.",
    )


@router.get(
    "/brand-profile",
    response_model=BrandProfileResponse,
    summary="Get the current tenant's brand profile",
)
async def get_brand_profile(
    current_user: dict = Depends(get_current_user),
    repo: BrandProfileRepository = Depends(get_brand_profile_repo),
) -> BrandProfileResponse:
    """Return the BrandProfile for the authenticated tenant."""
    tenant_id = _get_tenant_id(current_user)
    profile = await repo.get_by_tenant(tenant_id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No brand profile found. Use POST /onboarding/extract-brand first.",
        )

    return BrandProfileResponse(
        id=profile.id,
        tenant_id=profile.tenant_id,
        brand_name=profile.brand_name,
        website_url=profile.website_url,
        tagline=profile.tagline,
        visual_identity=profile.visual_identity or {},
        written_identity=profile.written_identity or {},
        core_value_props=profile.core_value_props or [],
        conversion_assets=profile.conversion_assets or {},
        icp_pain_points=profile.icp_pain_points or [],
        extraction_status=profile.extraction_status,
        screenshot_url=profile.screenshot_url,
        last_extracted_at=profile.last_extracted_at.isoformat() if profile.last_extracted_at else None,
    )


@router.put(
    "/brand-profile",
    response_model=BrandProfileResponse,
    summary="Manually update brand profile fields",
)
async def update_brand_profile(
    body: BrandProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
    repo: BrandProfileRepository = Depends(get_brand_profile_repo),
) -> BrandProfileResponse:
    """Override or refine specific BrandProfile fields (operator manual edit)."""
    tenant_id = _get_tenant_id(current_user)
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update.",
        )

    profile = await repo.get_by_tenant(tenant_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No brand profile found. Use POST /onboarding/extract-brand first.",
        )

    for key, value in updates.items():
        if hasattr(profile, key):
            setattr(profile, key, value)
    await repo.session.commit()

    # Refresh for response
    refreshed = await repo.get_by_tenant(tenant_id)
    if refreshed is None:
        raise HTTPException(status_code=500, detail="Failed to reload updated profile")

    return BrandProfileResponse(
        id=refreshed.id,
        tenant_id=refreshed.tenant_id,
        brand_name=refreshed.brand_name,
        website_url=refreshed.website_url,
        tagline=refreshed.tagline,
        visual_identity=refreshed.visual_identity or {},
        written_identity=refreshed.written_identity or {},
        core_value_props=refreshed.core_value_props or [],
        conversion_assets=refreshed.conversion_assets or {},
        icp_pain_points=refreshed.icp_pain_points or [],
        extraction_status=refreshed.extraction_status,
        screenshot_url=refreshed.screenshot_url,
        last_extracted_at=refreshed.last_extracted_at.isoformat() if refreshed.last_extracted_at else None,
    )

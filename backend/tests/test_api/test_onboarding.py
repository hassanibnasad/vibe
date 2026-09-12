from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.dependencies import DEFAULT_TENANT_ID
from app.repositories.brand_profile_repo import BrandProfileRepository


@pytest.mark.asyncio
async def test_onboarding_extract_brand_endpoint(client: AsyncClient):
    with patch("app.workflows.onboarding_workflow.tenant_onboarding_task.aio_run_no_wait", new_callable=AsyncMock) as mock_dispatch:
        mock_job = AsyncMock()
        mock_job.workflow_run_id = "job-12345"
        mock_dispatch.return_value = mock_job

        payload = {
            "website_url": "https://acme.ai",
            "brand_name": "Acme AI",
        }
        res = await client.post("/api/v1/onboarding/extract-brand", json=payload)
        assert res.status_code == 202
        data = res.json()
        assert data["job_id"] == "job-12345"
        assert data["brand_name"] == "Acme AI"
        assert data["status"] == "queued"


@pytest.mark.asyncio
async def test_onboarding_brand_profile_crud(client: AsyncClient, db_session):
    # 1. GET non-existent profile should return 404
    get_res = await client.get("/api/v1/onboarding/brand-profile")
    assert get_res.status_code == 404

    # 2. Seed profile via repo
    repo = BrandProfileRepository(db_session)
    await repo.upsert(
        tenant_id=DEFAULT_TENANT_ID,
        brand_name="Acme Corporation",
        tagline="Autonomous AI Systems",
        visual_identity={"palette": {"primary": "#1E293B"}},
        written_identity={"archetype": "Expert"},
        core_value_props=["Self-healing workflows"],
        conversion_assets={"lead_magnets": ["Whitepaper"]},
        icp_pain_points=[{"feature": "Hatchet", "pain_hook": "Downtime"}],
        extraction_status="complete",
    )
    await db_session.commit()

    # 3. GET profile
    get_res = await client.get("/api/v1/onboarding/brand-profile")
    assert get_res.status_code == 200
    profile_data = get_res.json()
    assert profile_data["brand_name"] == "Acme Corporation"
    assert profile_data["tagline"] == "Autonomous AI Systems"
    assert profile_data["visual_identity"]["palette"]["primary"] == "#1E293B"

    # 4. PUT update profile
    update_res = await client.put(
        "/api/v1/onboarding/brand-profile",
        json={"tagline": "Enterprise Autonomous AI Systems"},
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["tagline"] == "Enterprise Autonomous AI Systems"

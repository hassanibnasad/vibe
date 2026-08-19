import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead


@pytest.mark.asyncio
async def test_list_leads_empty(client: AsyncClient):
    response = await client.get("/api/v1/leads")
    assert response.status_code == 200
    data = response.json()
    assert data["data"] == []
    assert data["pagination"]["total"] == 0


@pytest.mark.asyncio
async def test_get_pipeline_summary(client: AsyncClient, db_session: AsyncSession):
    lead = Lead(
        name="Alice Marketer",
        platform="linkedin",
        platform_user_id="user-12345",
        lead_score=60,
        lead_stage="hot",
    )
    db_session.add(lead)
    await db_session.flush()

    response = await client.get("/api/v1/leads/pipeline")
    assert response.status_code == 200
    data = response.json()
    assert data["hot"] >= 1

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_campaign(client: AsyncClient):
    payload = {
        "name": "Q3 SaaS Product Launch",
        "description": "Cross-channel promotional blitz for VibeAgent v1.0",
        "target_audience": "B2B SaaS Founders & Growth Marketers",
        "goals": ["50 target leads", "20 target MQLs"],
    }

    create_res = await client.post("/api/v1/campaigns", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["name"] == payload["name"]
    assert created["status"] == "draft"

    campaign_id = created["id"]
    get_res = await client.get(f"/api/v1/campaigns/{campaign_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == campaign_id


@pytest.mark.asyncio
async def test_list_campaigns(client: AsyncClient):
    res = await client.get("/api/v1/campaigns")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

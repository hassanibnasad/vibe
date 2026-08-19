import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_post(client: AsyncClient):
    payload = {
        "content": "Excited to introduce our new open-source marketing AI agent!",
        "hashtags": ["#marketing", "#ai"],
        "cta": "Check out our repo!",
    }

    create_res = await client.post("/api/v1/posts", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["content"] == payload["content"]
    assert created_data["status"] == "draft"

    post_id = created_data["id"]
    get_res = await client.get(f"/api/v1/posts/{post_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == post_id

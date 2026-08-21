from unittest.mock import AsyncMock, patch
import json
import pytest
from httpx import AsyncClient

from app.tools.ai.llm_client import LLMResponse


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


@pytest.mark.asyncio
async def test_update_and_approve_post(client: AsyncClient):
    # 1. Create draft
    create_res = await client.post(
        "/api/v1/posts",
        json={"content": "Initial draft content for LinkedIn"},
    )
    assert create_res.status_code == 201
    post_id = create_res.json()["id"]

    # 2. Update draft
    update_res = await client.put(
        f"/api/v1/posts/{post_id}",
        json={"content": "Polished draft content with hashtags", "hashtags": ["#AI", "#Tech"]},
    )
    assert update_res.status_code == 200
    assert update_res.json()["content"] == "Polished draft content with hashtags"
    assert update_res.json()["hashtags"] == ["#AI", "#Tech"]

    # 3. Approve post
    approve_res = await client.post(f"/api/v1/posts/{post_id}/approve")
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"
    assert approve_res.json()["requires_review"] is False


@pytest.mark.asyncio
async def test_list_and_delete_post(client: AsyncClient):
    # Create 2 posts
    await client.post("/api/v1/posts", json={"content": "Post 1"})
    res2 = await client.post("/api/v1/posts", json={"content": "Post 2"})
    post2_id = res2.json()["id"]

    # List posts
    list_res = await client.get("/api/v1/posts?page=1&limit=10")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert len(list_data["data"]) >= 2
    assert list_data["pagination"]["total"] >= 2

    # Delete post
    del_res = await client.delete(f"/api/v1/posts/{post2_id}")
    assert del_res.status_code == 204

    # Verify not found
    get_res = await client.get(f"/api/v1/posts/{post2_id}")
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_generate_post_variants_api(client: AsyncClient):
    mock_generate = AsyncMock(
        return_value=LLMResponse(
            text=json.dumps({
                "content": "AI generated candidate post",
                "hashtags": ["#B2B", "#AI"],
                "cta": "Sign up today",
            }),
            model="llama3.1:8b",
            tokens_used=70,
            latency_ms=250,
        )
    )

    with patch("app.tools.ai.llm_client.LLMClient.generate", mock_generate):
        res = await client.post(
            "/api/v1/posts/generate-variants",
            json={
                "brief": "Launch of our new agentic workflow automation platform",
                "platforms": ["linkedin"],
                "tone": "innovative",
                "variants": 2,
            },
        )

        assert res.status_code == 201
        data = res.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["variant_label"] == "A"
        assert data[1]["variant_label"] == "B"

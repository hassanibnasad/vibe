from unittest.mock import patch

import pytest
from httpx import AsyncClient

from app.services.image_generation_service import ImageResult


@pytest.mark.asyncio
async def test_generate_image_endpoint(client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_PROVIDER", "huggingface")

    mock_result = [
        ImageResult(
            url="http://localhost:8000/media/flux_test123.webp",
            prompt="A sleek modern enterprise dashboard with AI analytics",
            width=1024,
            height=1024,
            provider="huggingface-flux-schnell",
        )
    ]

    with patch("app.api.v1.images.ImageGenerationService.generate", return_value=mock_result):
        response = await client.post(
            "/api/v1/images/generate",
            json={
                "prompt": "A sleek modern enterprise dashboard with AI analytics",
                "aspect_ratio": "1:1",
                "style_preset": "minimalist_3d",
                "n": 1,
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["url"] == "http://localhost:8000/media/flux_test123.webp"
    assert data[0]["provider"] == "huggingface-flux-schnell"
    assert data[0]["width"] == 1024
    assert data[0]["height"] == 1024


@pytest.mark.asyncio
async def test_generate_image_empty_returns_bad_gateway(client: AsyncClient):
    with patch("app.api.v1.images.ImageGenerationService.generate", return_value=[]):
        response = await client.post(
            "/api/v1/images/generate",
            json={
                "prompt": "Test prompt with no result",
                "n": 1,
            },
        )

    assert response.status_code == 502
    assert "no results" in response.json()["detail"].lower()

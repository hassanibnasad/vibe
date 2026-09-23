"""Tests for ImageGenerationService — all network calls are mocked."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.image_generation_service import ImageGenerationService, ImageResult


# ── Helpers ───────────────────────────────────────────────────────────────────


def _make_service() -> ImageGenerationService:
    return ImageGenerationService()


# ── Together AI ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_together_returns_image_results(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_PROVIDER", "together")
    monkeypatch.setattr("app.services.image_generation_service.settings.TOGETHER_API_KEY", "test-key")
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_MODEL", "black-forest-labs/FLUX.1-schnell-Free")
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_WIDTH", 1024)
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_HEIGHT", 1024)
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_STEPS", 4)

    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {"data": [{"url": "https://cdn.together.xyz/img/abc.png"}]}

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("app.services.image_generation_service.httpx.AsyncClient", return_value=mock_client):
        service = _make_service()
        results = await service.generate("A futuristic city skyline", n=1)

    assert len(results) == 1
    assert isinstance(results[0], ImageResult)
    assert results[0].url == "https://cdn.together.xyz/img/abc.png"
    assert results[0].provider == "together"
    assert results[0].width == 1024


@pytest.mark.asyncio
async def test_together_missing_key_returns_empty(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_PROVIDER", "together")
    monkeypatch.setattr("app.services.image_generation_service.settings.TOGETHER_API_KEY", "")

    service = _make_service()
    results = await service.generate("anything")
    assert results == []


# ── Pollinations ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_pollinations_returns_url_results(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_PROVIDER", "pollinations")
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_WIDTH", 512)
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_HEIGHT", 512)

    service = _make_service()
    results = await service.generate("A mountain lake at sunrise", n=2)

    assert len(results) == 2
    for r in results:
        assert r.provider == "pollinations"
        assert "image.pollinations.ai" in r.url
        assert "mountain" in r.url  # prompt encoded in URL
        assert r.width == 512


# ── Disabled ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_disabled_provider_returns_empty(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_PROVIDER", "")

    service = _make_service()
    results = await service.generate("anything")
    assert results == []


@pytest.mark.asyncio
async def test_unknown_provider_returns_empty(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_PROVIDER", "dalle-unknown")

    service = _make_service()
    results = await service.generate("anything")
    assert results == []

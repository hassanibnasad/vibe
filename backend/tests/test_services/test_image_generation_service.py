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


# ── Hugging Face Space (FLUX.1-schnell) ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_huggingface_space_returns_image_results(monkeypatch: pytest.MonkeyPatch, tmp_path) -> None:
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_PROVIDER", "huggingface")
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_MODEL", "black-forest-labs/FLUX.1-schnell")
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_SPACE_ID", "black-forest-labs/FLUX.1-schnell")
    monkeypatch.setattr("app.services.image_generation_service.settings.HF_TOKEN", "hf_test_token")
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_WIDTH", 1024)
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_HEIGHT", 1024)
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_STEPS", 4)

    # Create dummy image file that client would return
    fake_img = tmp_path / "result.webp"
    fake_img.write_bytes(b"dummy-image-bytes")

    mock_client_instance = MagicMock()
    mock_client_instance.predict.return_value = ({"path": str(fake_img), "url": None}, 42)

    with patch("gradio_client.Client", return_value=mock_client_instance) as mock_client_cls:
        service = _make_service()
        results = await service.generate("A cutting-edge SaaS platform interface", n=1)

    mock_client_cls.assert_called_once_with("black-forest-labs/FLUX.1-schnell", hf_token="hf_test_token")
    assert len(results) == 1
    assert results[0].provider == "huggingface-flux-schnell"
    assert "/media/flux_" in results[0].url
    assert results[0].width == 1024
    assert results[0].height == 1024


@pytest.mark.asyncio
async def test_huggingface_space_quota_error_falls_back_to_pollinations(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_PROVIDER", "huggingface")
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_MODEL", "black-forest-labs/FLUX.1-schnell")

    mock_client_instance = MagicMock()
    mock_client_instance.predict.side_effect = Exception("ZeroGPU quota exceeded")

    with patch("gradio_client.Client", return_value=mock_client_instance):
        service = _make_service()
        results = await service.generate("Test prompt", n=1, fallback_to_pollinations=True)

    assert len(results) == 1
    assert results[0].provider == "pollinations"
    assert "model=flux" in results[0].url


@pytest.mark.asyncio
async def test_huggingface_space_failure_without_fallback_returns_empty(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.services.image_generation_service.settings.IMAGE_GEN_PROVIDER", "huggingface")

    mock_client_instance = MagicMock()
    mock_client_instance.predict.side_effect = Exception("Connection error")

    with patch("gradio_client.Client", return_value=mock_client_instance):
        service = _make_service()
        results = await service.generate("Test prompt", n=1, fallback_to_pollinations=False)

    assert results == []


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


"""Tests for LLMClient provider routing logic.

We only test the pure routing methods (_resolve_model_name, _get_api_base)
without making real network calls.
"""

from __future__ import annotations

import pytest

from app.tools.ai.llm_client import LLMClient


def _client(proxy_url: str = "") -> LLMClient:
    return LLMClient(proxy_url=proxy_url if proxy_url else None)


# ── _resolve_model_name ────────────────────────────────────────────────────────


def test_resolve_primary_aliases(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.tools.ai.llm_client.settings.LLM_MODEL_PRIMARY", "groq/llama-3.3-70b-versatile")
    c = _client()
    for alias in ("primary", "70b", "llama-70b", "llama3.1:70b", "llama-3.3-70b"):
        assert c._resolve_model_name(alias) == "groq/llama-3.3-70b-versatile"


def test_resolve_fast_aliases(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.tools.ai.llm_client.settings.LLM_MODEL_FAST", "groq/llama-3.1-8b-instant")
    c = _client()
    for alias in ("fast", "8b", "llama-8b", "llama3.1:8b", "llama-3.1-8b"):
        assert c._resolve_model_name(alias) == "groq/llama-3.1-8b-instant"


def test_resolve_none_returns_fast(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.tools.ai.llm_client.settings.LLM_MODEL_FAST", "groq/llama-3.1-8b-instant")
    c = _client()
    assert c._resolve_model_name(None) == "groq/llama-3.1-8b-instant"


def test_resolve_bare_name_prefixes_ollama() -> None:
    c = _client()
    assert c._resolve_model_name("mistral") == "ollama/mistral"


def test_resolve_explicit_provider_passthrough() -> None:
    c = _client()
    assert c._resolve_model_name("deepseek/deepseek-chat") == "deepseek/deepseek-chat"
    assert c._resolve_model_name("gemini/gemini-2.0-flash") == "gemini/gemini-2.0-flash"


# ── _get_api_base ──────────────────────────────────────────────────────────────


def test_proxy_url_always_wins() -> None:
    c = _client(proxy_url="http://proxy:4000")
    for model in ("groq/llama-3.3-70b-versatile", "ollama/llama3.1:8b", "gemini/gemini-2.0-flash"):
        assert c._get_api_base(model) == "http://proxy:4000"


def test_cloud_providers_return_none() -> None:
    c = _client()
    cloud_models = [
        "groq/llama-3.1-8b-instant",
        "gemini/gemini-2.0-flash",
        "deepseek/deepseek-chat",
        "openrouter/meta-llama/llama-3.3-70b-instruct",
        "together_ai/mistralai/Mixtral-8x7B-Instruct-v0.1",
        "anthropic/claude-3-haiku",
    ]
    for model in cloud_models:
        assert c._get_api_base(model) is None, f"Expected None for {model}"


def test_ollama_returns_ollama_base_url() -> None:
    c = _client()
    result = c._get_api_base("ollama/llama3.1:70b")
    assert result is not None
    assert "11434" in result or "ollama" in result.lower()


def test_unknown_model_returns_none() -> None:
    c = _client()
    assert c._get_api_base("some-unknown/model") is None

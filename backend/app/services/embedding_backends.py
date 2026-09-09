"""
Embedding backend implementations.

Strategy pattern: each backend implements the ``EmbeddingBackend`` protocol
so the ``EmbeddingService`` can swap inference engines without affecting callers.

Two backends are provided:
  - ``FastEmbedBackend``: In-process ONNX inference via fastembed. Zero network
    calls, $0 cost.  Default for development and production.
  - ``LiteLLMBackend``: Delegates to ``litellm.aembedding()``.  Supports Ollama,
    OpenAI, DeepInfra, Together AI, etc.  Use when offloading compute is desired.
"""

from __future__ import annotations

import asyncio
from typing import Any, Protocol, runtime_checkable

import structlog

logger = structlog.get_logger()


# ── Protocol ──────────────────────────────────────────────────────────────────


@runtime_checkable
class EmbeddingBackend(Protocol):
    """Interface every embedding backend must satisfy."""

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed one or more texts and return their vector representations."""
        ...

    @property
    def dimensions(self) -> int:
        """Dimensionality of the vectors produced by this backend."""
        ...

    @property
    def model_name(self) -> str:
        """Human-readable model identifier."""
        ...


# ── FastEmbed (in-process ONNX) ──────────────────────────────────────────────


class FastEmbedBackend:
    """
    In-process ONNX inference via the ``fastembed`` library (maintained by Qdrant).

    Runs quantized models on CPU with ~20-40ms latency per chunk.  No external
    network calls, no API keys, $0 cost.

    The underlying ``TextEmbedding`` model is lazily initialised on first call
    to avoid blocking import time.
    """

    def __init__(self, model_name: str | None = None) -> None:
        from app.config import settings  # noqa: PLC0415

        self._model_name = model_name or settings.EMBEDDING_MODEL
        self._model: Any = None

    def _get_model(self) -> Any:
        if self._model is None:
            from fastembed import TextEmbedding  # noqa: PLC0415

            self._model = TextEmbedding(model_name=self._model_name)
            logger.info(
                "fastembed_backend.model_loaded",
                model=self._model_name,
            )
        return self._model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed texts using in-process ONNX inference.

        ``fastembed`` is synchronous, so we run it in the default executor
        to avoid blocking the event loop.
        """
        loop = asyncio.get_running_loop()
        model = self._get_model()

        def _sync_embed() -> list[list[float]]:
            # fastembed returns a generator; materialise into lists.
            return [vec.tolist() for vec in model.embed(texts)]

        return await loop.run_in_executor(None, _sync_embed)

    @property
    def dimensions(self) -> int:
        # Resolve from the model metadata; fall back to known defaults or config.
        _KNOWN_DIMS: dict[str, int] = {
            "BAAI/bge-small-en-v1.5": 384,
            "BAAI/bge-base-en-v1.5": 768,
            "BAAI/bge-large-en-v1.5": 1024,
            "BAAI/bge-m3": 1024,
            "nomic-ai/nomic-embed-text-v1.5": 768,
            "sentence-transformers/all-MiniLM-L6-v2": 384,
        }
        if self._model_name in _KNOWN_DIMS:
            return _KNOWN_DIMS[self._model_name]

        from app.config import settings  # noqa: PLC0415

        return getattr(settings, "EMBEDDING_DIMENSIONS", 1024)

    @property
    def model_name(self) -> str:
        return self._model_name


# ── LiteLLM (external provider) ──────────────────────────────────────────────


class LiteLLMBackend:
    """
    Delegates embedding to ``litellm.aembedding()`` which supports 100+ providers
    (Ollama, OpenAI, DeepInfra, Together AI, etc.).

    Reads model name and connection parameters from ``app.config.settings``.
    """

    def __init__(
        self,
        model: str | None = None,
        api_base: str | None = None,
        api_key: str | None = None,
        dimensions: int | None = None,
    ) -> None:
        from app.config import settings  # noqa: PLC0415

        self._model = model or settings.LLM_EMBED_MODEL
        self._api_base = api_base or (
            settings.LITELLM_PROXY_URL
            or (settings.OLLAMA_BASE_URL if self._model.startswith("ollama/") else None)
        )
        self._api_key = api_key or settings.LITELLM_API_KEY or None
        self._dimensions = (
            dimensions if dimensions is not None else settings.EMBEDDING_DIMENSIONS
        )

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed texts via a single litellm.aembedding() call."""
        import litellm  # noqa: PLC0415

        kwargs: dict[str, Any] = {
            "model": self._model,
            "input": texts,
        }
        if self._api_base:
            kwargs["api_base"] = self._api_base
        if self._api_key:
            kwargs["api_key"] = self._api_key

        try:
            response = await litellm.aembedding(**kwargs)
            return [item["embedding"] for item in response.data]
        except Exception as exc:
            logger.error(
                "litellm_backend.embed_failed",
                model=self._model,
                batch_size=len(texts),
                error=str(exc),
            )
            raise

    @property
    def dimensions(self) -> int:
        return self._dimensions

    @property
    def model_name(self) -> str:
        return self._model

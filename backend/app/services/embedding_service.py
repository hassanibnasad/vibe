"""
EmbeddingService — centralised, enterprise-grade embedding abstraction.

Every part of the application that needs vector embeddings MUST go through
this service.  Direct calls to ``LLMClient.embed()`` are deprecated.

Key design properties:
  - **Backend abstraction**: swap between in-process ONNX (FastEmbed) and
    external providers (LiteLLM) via ``EMBEDDING_BACKEND`` env var.
  - **Task-aware prefixing**: modern embedding models (BGE, Nomic) require
    different instruction prefixes for indexing vs. querying.  Callers pass
    ``EmbedTask.SEARCH_DOCUMENT`` or ``EmbedTask.SEARCH_QUERY`` and the
    service prepends the correct prefix automatically.
  - **Native batching**: ``embed_many()`` sends texts as a single batch to
    the backend, reducing overhead vs. N individual calls.
  - **Dimension validation**: at construction time, asserts that the backend's
    output dimensions match ``EMBEDDING_DIMENSIONS`` in config to prevent
    model/schema mismatch with the ``knowledge_docs.embedding`` column.
"""

from __future__ import annotations

import enum

import structlog

from app.config import settings
from app.services.embedding_backends import EmbeddingBackend, FastEmbedBackend, LiteLLMBackend
from app.services.embedding_cache import EmbeddingCache

logger = structlog.get_logger()


# ── Task enum ─────────────────────────────────────────────────────────────────


class EmbedTask(str, enum.Enum):
    """Controls instruction-prefix prepended to input text."""

    SEARCH_DOCUMENT = "search_document"
    SEARCH_QUERY = "search_query"


# Task prefix map: model-family → {task → prefix string}.
# Models that don't need prefixes (e.g. MiniLM) are absent from this map.
_TASK_PREFIXES: dict[str, dict[EmbedTask, str]] = {
    "bge": {
        EmbedTask.SEARCH_DOCUMENT: "Represent this document for retrieval: ",
        EmbedTask.SEARCH_QUERY: "Represent this sentence for searching relevant passages: ",
    },
    "nomic": {
        EmbedTask.SEARCH_DOCUMENT: "search_document: ",
        EmbedTask.SEARCH_QUERY: "search_query: ",
    },
}


def _detect_prefix_family(model_name: str) -> str | None:
    """Detect which prefix family a model belongs to, or None if no prefix needed."""
    lower = model_name.lower()
    if "bge" in lower:
        return "bge"
    if "nomic" in lower:
        return "nomic"
    return None


# ── EmbeddingService ──────────────────────────────────────────────────────────


class EmbeddingService:
    """
    Centralised embedding service.

    Parameters
    ----------
    backend:
        The embedding backend to use.  If ``None``, one is constructed
        automatically based on ``settings.EMBEDDING_BACKEND``.
    cache:
        Redis embedding cache.  If ``None`` and ``settings.EMBEDDING_CACHE_ENABLED``
        is True, a default ``EmbeddingCache`` is instantiated.
    validate_dimensions:
        If ``True`` (default), asserts that the backend's declared dimensions
        match ``settings.EMBEDDING_DIMENSIONS``.  Set to ``False`` in tests
        when using mocks.
    """

    def __init__(
        self,
        backend: EmbeddingBackend | None = None,
        cache: EmbeddingCache | None = None,
        validate_dimensions: bool = True,
    ) -> None:
        self._backend = backend or self._build_default_backend()
        self._prefix_family = _detect_prefix_family(self._backend.model_name)

        if cache is not None:
            self._cache: EmbeddingCache | None = cache
        elif getattr(settings, "EMBEDDING_CACHE_ENABLED", True):
            self._cache = EmbeddingCache()
        else:
            self._cache = None

        if validate_dimensions:
            expected = settings.EMBEDDING_DIMENSIONS
            actual = self._backend.dimensions
            if actual != expected:
                raise ValueError(
                    f"Embedding dimension mismatch: backend '{self._backend.model_name}' "
                    f"produces {actual}-dim vectors but EMBEDDING_DIMENSIONS is set to "
                    f"{expected}. Update the config or change the model."
                )

        logger.info(
            "embedding_service.initialised",
            backend=type(self._backend).__name__,
            model=self._backend.model_name,
            dimensions=self._backend.dimensions,
            prefix_family=self._prefix_family,
            cache_enabled=self._cache is not None,
        )

    # ── Public API ────────────────────────────────────────────────────────────

    async def embed(
        self,
        text: str,
        *,
        task: EmbedTask = EmbedTask.SEARCH_QUERY,
    ) -> list[float]:
        """Embed a single text string.

        Parameters
        ----------
        text:
            The text to embed.
        task:
            The embedding task context.  Determines which instruction prefix
            is prepended (if the model requires one).
        """
        prefixed = self._apply_prefix(text, task)
        model_name = self._backend.model_name

        if self._cache is not None:
            cached = await self._cache.get(model_name, prefixed)
            if cached is not None:
                return cached

        results = await self._backend.embed([prefixed])
        embedding = results[0]

        if self._cache is not None:
            await self._cache.set(model_name, prefixed, embedding)

        return embedding

    async def embed_many(
        self,
        texts: list[str],
        *,
        task: EmbedTask = EmbedTask.SEARCH_DOCUMENT,
        batch_size: int | None = None,
    ) -> list[list[float]]:
        """Embed multiple texts in batches.

        Utilises Redis cache to skip already-embedded texts and sends only
        cache misses to the backend.

        Parameters
        ----------
        texts:
            List of text strings to embed.
        task:
            The embedding task context for all texts in this batch.
        batch_size:
            Max texts per backend call.  Defaults to
            ``settings.EMBEDDING_BATCH_SIZE``.
        """
        if not texts:
            return []

        prefixed = [self._apply_prefix(t, task) for t in texts]
        model_name = self._backend.model_name

        cached_results: list[list[float] | None] = [None] * len(prefixed)
        if self._cache is not None:
            cached_results = await self._cache.get_many(model_name, prefixed)

        miss_indices = [i for i, c in enumerate(cached_results) if c is None]

        if miss_indices:
            miss_texts = [prefixed[i] for i in miss_indices]
            _batch_size = batch_size or settings.EMBEDDING_BATCH_SIZE
            computed_embeddings: list[list[float]] = []

            for i in range(0, len(miss_texts), _batch_size):
                batch = miss_texts[i : i + _batch_size]
                batch_result = await self._backend.embed(batch)
                computed_embeddings.extend(batch_result)

            new_cache_items: list[tuple[str, list[float]]] = []
            for idx, emb in zip(miss_indices, computed_embeddings):
                cached_results[idx] = emb
                new_cache_items.append((prefixed[idx], emb))

            if self._cache is not None and new_cache_items:
                await self._cache.set_many(model_name, new_cache_items)

        return [c for c in cached_results if c is not None]

    @property
    def dimensions(self) -> int:
        """Vector dimensionality produced by the current backend."""
        return self._backend.dimensions

    @property
    def model_name(self) -> str:
        """Model identifier of the current backend."""
        return self._backend.model_name

    # ── Internal ──────────────────────────────────────────────────────────────

    def _apply_prefix(self, text: str, task: EmbedTask) -> str:
        """Prepend the task-specific instruction prefix if the model requires it."""
        if self._prefix_family is None:
            return text
        prefixes = _TASK_PREFIXES.get(self._prefix_family, {})
        prefix = prefixes.get(task, "")
        return f"{prefix}{text}"

    @staticmethod
    def _build_default_backend() -> EmbeddingBackend:
        """Construct the default backend based on ``settings.EMBEDDING_BACKEND``."""
        backend_type = settings.EMBEDDING_BACKEND.lower()

        if backend_type == "fastembed":
            return FastEmbedBackend(model_name=settings.EMBEDDING_MODEL)

        if backend_type == "litellm":
            return LiteLLMBackend(
                model=settings.LLM_EMBED_MODEL,
                dimensions=settings.EMBEDDING_DIMENSIONS,
            )

        raise ValueError(
            f"Unknown EMBEDDING_BACKEND: '{settings.EMBEDDING_BACKEND}'. "
            f"Supported values: 'fastembed', 'litellm'."
        )

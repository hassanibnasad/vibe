"""Tests for the centralized EmbeddingService and its backends."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.embedding_service import EmbedTask, EmbeddingService, _detect_prefix_family


# ── Prefix detection ─────────────────────────────────────────────────────────


class TestPrefixDetection:
    def test_bge_model(self):
        assert _detect_prefix_family("BAAI/bge-small-en-v1.5") == "bge"
        assert _detect_prefix_family("BAAI/bge-m3") == "bge"
        assert _detect_prefix_family("BAAI/bge-large-en-v1.5") == "bge"

    def test_nomic_model(self):
        assert _detect_prefix_family("nomic-ai/nomic-embed-text-v1.5") == "nomic"

    def test_minilm_no_prefix(self):
        assert _detect_prefix_family("sentence-transformers/all-MiniLM-L6-v2") is None

    def test_unknown_model_no_prefix(self):
        assert _detect_prefix_family("some-random/model") is None


# ── EmbeddingService with mock backend ───────────────────────────────────────


def _make_mock_backend(model_name: str = "BAAI/bge-small-en-v1.5", dimensions: int = 384):
    """Create a mock embedding backend."""
    backend = AsyncMock()
    backend.dimensions = dimensions
    backend.model_name = model_name
    backend.embed = AsyncMock(return_value=[[0.1] * dimensions])
    return backend


class TestEmbeddingService:
    @patch("app.services.embedding_service.settings")
    def test_dimension_validation_passes(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 384
        mock_settings.EMBEDDING_BATCH_SIZE = 32
        backend = _make_mock_backend(dimensions=384)
        svc = EmbeddingService(backend=backend, validate_dimensions=True)
        assert svc.dimensions == 384

    @patch("app.services.embedding_service.settings")
    def test_dimension_validation_fails(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 1024
        backend = _make_mock_backend(dimensions=384)
        with pytest.raises(ValueError, match="Embedding dimension mismatch"):
            EmbeddingService(backend=backend, validate_dimensions=True)

    @patch("app.services.embedding_service.settings")
    def test_skip_dimension_validation(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 1024
        backend = _make_mock_backend(dimensions=384)
        # Should not raise when validate_dimensions=False
        svc = EmbeddingService(backend=backend, validate_dimensions=False)
        assert svc.dimensions == 384

    @pytest.mark.asyncio
    @patch("app.services.embedding_service.settings")
    async def test_embed_single_text(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 384
        mock_settings.EMBEDDING_BATCH_SIZE = 32
        mock_settings.EMBEDDING_CACHE_ENABLED = False
        backend = _make_mock_backend()
        svc = EmbeddingService(backend=backend, validate_dimensions=True)

        result = await svc.embed("test query", task=EmbedTask.SEARCH_QUERY)
        assert len(result) == 384
        backend.embed.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("app.services.embedding_service.settings")
    async def test_embed_applies_bge_query_prefix(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 384
        mock_settings.EMBEDDING_BATCH_SIZE = 32
        backend = _make_mock_backend(model_name="BAAI/bge-small-en-v1.5")
        svc = EmbeddingService(backend=backend, validate_dimensions=True)

        await svc.embed("pricing details", task=EmbedTask.SEARCH_QUERY)
        call_args = backend.embed.call_args[0][0]
        assert call_args[0].startswith("Represent this sentence for searching relevant passages: ")

    @pytest.mark.asyncio
    @patch("app.services.embedding_service.settings")
    async def test_embed_applies_bge_document_prefix(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 384
        mock_settings.EMBEDDING_BATCH_SIZE = 32
        backend = _make_mock_backend(model_name="BAAI/bge-small-en-v1.5")
        svc = EmbeddingService(backend=backend, validate_dimensions=True)

        await svc.embed("Our brand voice is innovative.", task=EmbedTask.SEARCH_DOCUMENT)
        call_args = backend.embed.call_args[0][0]
        assert call_args[0].startswith("Represent this document for retrieval: ")

    @pytest.mark.asyncio
    @patch("app.services.embedding_service.settings")
    async def test_embed_no_prefix_for_minilm(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 384
        mock_settings.EMBEDDING_BATCH_SIZE = 32
        backend = _make_mock_backend(model_name="sentence-transformers/all-MiniLM-L6-v2")
        svc = EmbeddingService(backend=backend, validate_dimensions=True)

        await svc.embed("hello world", task=EmbedTask.SEARCH_QUERY)
        call_args = backend.embed.call_args[0][0]
        assert call_args == ["hello world"]

    @pytest.mark.asyncio
    @patch("app.services.embedding_service.settings")
    async def test_embed_many_batching(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 384
        mock_settings.EMBEDDING_BATCH_SIZE = 2  # small batch for testing
        backend = _make_mock_backend()
        # Return correct number of embeddings per call
        backend.embed = AsyncMock(side_effect=[
            [[0.1] * 384, [0.2] * 384],  # first batch of 2
            [[0.3] * 384],               # second batch of 1
        ])
        svc = EmbeddingService(backend=backend, validate_dimensions=True)

        results = await svc.embed_many(
            ["text1", "text2", "text3"],
            task=EmbedTask.SEARCH_DOCUMENT,
        )

        assert len(results) == 3
        assert backend.embed.call_count == 2  # 2 batches

    @pytest.mark.asyncio
    @patch("app.services.embedding_service.settings")
    async def test_embed_many_empty_list(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 384
        mock_settings.EMBEDDING_BATCH_SIZE = 32
        backend = _make_mock_backend()
        svc = EmbeddingService(backend=backend, validate_dimensions=True)

        results = await svc.embed_many([], task=EmbedTask.SEARCH_DOCUMENT)
        assert results == []
        backend.embed.assert_not_awaited()

    @patch("app.services.embedding_service.settings")
    def test_model_name_exposed(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 384
        backend = _make_mock_backend(model_name="BAAI/bge-small-en-v1.5")
        svc = EmbeddingService(backend=backend, validate_dimensions=True)
        assert svc.model_name == "BAAI/bge-small-en-v1.5"

    @pytest.mark.asyncio
    @patch("app.services.embedding_service.settings")
    async def test_embed_with_cache_hit(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 1024
        mock_settings.EMBEDDING_BATCH_SIZE = 32
        backend = _make_mock_backend(model_name="BAAI/bge-large-en-v1.5", dimensions=1024)

        mock_cache = AsyncMock()
        mock_cache.get = AsyncMock(return_value=[0.5] * 1024)

        svc = EmbeddingService(backend=backend, cache=mock_cache, validate_dimensions=True)
        result = await svc.embed("hello", task=EmbedTask.SEARCH_QUERY)

        assert result == [0.5] * 1024
        backend.embed.assert_not_awaited()
        mock_cache.get.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("app.services.embedding_service.settings")
    async def test_embed_with_cache_miss_populates_cache(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 1024
        mock_settings.EMBEDDING_BATCH_SIZE = 32
        backend = _make_mock_backend(model_name="BAAI/bge-large-en-v1.5", dimensions=1024)
        backend.embed = AsyncMock(return_value=[[0.7] * 1024])

        mock_cache = AsyncMock()
        mock_cache.get = AsyncMock(return_value=None)
        mock_cache.set = AsyncMock()

        svc = EmbeddingService(backend=backend, cache=mock_cache, validate_dimensions=True)
        result = await svc.embed("hello", task=EmbedTask.SEARCH_QUERY)

        assert result == [0.7] * 1024
        backend.embed.assert_awaited_once()
        mock_cache.set.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("app.services.embedding_service.settings")
    async def test_embed_many_with_cache_partitioning(self, mock_settings):
        mock_settings.EMBEDDING_DIMENSIONS = 1024
        mock_settings.EMBEDDING_BATCH_SIZE = 32
        backend = _make_mock_backend(model_name="BAAI/bge-large-en-v1.5", dimensions=1024)
        # Only 1 miss sent to backend:
        backend.embed = AsyncMock(return_value=[[0.9] * 1024])

        mock_cache = AsyncMock()
        # text1 is hit, text2 is miss, text3 is hit
        mock_cache.get_many = AsyncMock(
            return_value=[[0.1] * 1024, None, [0.3] * 1024]
        )
        mock_cache.set_many = AsyncMock()

        svc = EmbeddingService(backend=backend, cache=mock_cache, validate_dimensions=True)
        results = await svc.embed_many(["t1", "t2", "t3"], task=EmbedTask.SEARCH_DOCUMENT)

        assert len(results) == 3
        assert results[0] == [0.1] * 1024
        assert results[1] == [0.9] * 1024
        assert results[2] == [0.3] * 1024
        # Backend was called with only t2
        backend.embed.assert_awaited_once()
        call_texts = backend.embed.call_args[0][0]
        assert len(call_texts) == 1
        assert "t2" in call_texts[0]
        # Cache set_many was called with t2
        mock_cache.set_many.assert_awaited_once()


# ── Backend unit tests ───────────────────────────────────────────────────────


class TestFastEmbedBackend:
    def test_dimensions_known_model(self):
        from app.services.embedding_backends import FastEmbedBackend

        backend = FastEmbedBackend(model_name="BAAI/bge-small-en-v1.5")
        assert backend.dimensions == 384

    def test_dimensions_baai_1024(self):
        from app.services.embedding_backends import FastEmbedBackend

        backend = FastEmbedBackend(model_name="BAAI/bge-large-en-v1.5")
        assert backend.dimensions == 1024

    def test_dimensions_bge_m3_1024(self):
        from app.services.embedding_backends import FastEmbedBackend

        backend = FastEmbedBackend(model_name="BAAI/bge-m3")
        assert backend.dimensions == 1024

    def test_dimensions_unknown_model_defaults(self):
        from app.config import settings
        from app.services.embedding_backends import FastEmbedBackend

        backend = FastEmbedBackend(model_name="some/unknown-model")
        assert backend.dimensions == settings.EMBEDDING_DIMENSIONS

    def test_model_name(self):
        from app.services.embedding_backends import FastEmbedBackend

        backend = FastEmbedBackend(model_name="nomic-ai/nomic-embed-text-v1.5")
        assert backend.model_name == "nomic-ai/nomic-embed-text-v1.5"


class TestLiteLLMBackend:
    @patch("app.config.settings")
    def test_model_name_from_settings(self, mock_settings):
        from app.services.embedding_backends import LiteLLMBackend

        mock_settings.LLM_EMBED_MODEL = "ollama/all-minilm:l6-v2"
        mock_settings.LITELLM_PROXY_URL = ""
        mock_settings.OLLAMA_BASE_URL = "http://localhost:11434"
        mock_settings.LITELLM_API_KEY = ""

        backend = LiteLLMBackend(dimensions=384)
        assert backend.model_name == "ollama/all-minilm:l6-v2"
        assert backend.dimensions == 384

    @pytest.mark.asyncio
    @patch("app.config.settings")
    async def test_embed_delegates_to_litellm(self, mock_settings):
        from app.services.embedding_backends import LiteLLMBackend
        from types import SimpleNamespace

        mock_settings.LLM_EMBED_MODEL = "ollama/all-minilm:l6-v2"
        mock_settings.LITELLM_PROXY_URL = ""
        mock_settings.OLLAMA_BASE_URL = "http://localhost:11434"
        mock_settings.LITELLM_API_KEY = ""

        mock_response = SimpleNamespace(
            data=[{"embedding": [0.1, 0.2, 0.3]}]
        )

        with patch("litellm.aembedding", new=AsyncMock(return_value=mock_response)):
            backend = LiteLLMBackend(dimensions=384)
            result = await backend.embed(["test text"])
            assert result == [[0.1, 0.2, 0.3]]

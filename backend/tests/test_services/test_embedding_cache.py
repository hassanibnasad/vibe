"""Tests for Redis EmbeddingCache."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.embedding_cache import EmbeddingCache


class TestEmbeddingCacheKey:
    def test_build_key_deterministic(self):
        k1 = EmbeddingCache.build_key("BAAI/bge-large-en-v1.5", "test text")
        k2 = EmbeddingCache.build_key("BAAI/bge-large-en-v1.5", "test text")
        assert k1 == k2
        assert k1.startswith("embed:BAAI/bge-large-en-v1.5:")

    def test_build_key_different_models(self):
        k1 = EmbeddingCache.build_key("BAAI/bge-large-en-v1.5", "hello")
        k2 = EmbeddingCache.build_key("BAAI/bge-small-en-v1.5", "hello")
        assert k1 != k2

    def test_build_key_different_texts(self):
        k1 = EmbeddingCache.build_key("BAAI/bge-large-en-v1.5", "hello")
        k2 = EmbeddingCache.build_key("BAAI/bge-large-en-v1.5", "world")
        assert k1 != k2


class TestEmbeddingCacheGet:
    @pytest.mark.asyncio
    async def test_get_hit(self):
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=json.dumps([0.1, 0.2, 0.3]))

        cache = EmbeddingCache(redis_client=mock_redis, enabled=True)
        result = await cache.get("model-a", "some text")

        assert result == [0.1, 0.2, 0.3]
        mock_redis.get.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_miss(self):
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=None)

        cache = EmbeddingCache(redis_client=mock_redis, enabled=True)
        result = await cache.get("model-a", "unseen text")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_disabled(self):
        mock_redis = AsyncMock()
        cache = EmbeddingCache(redis_client=mock_redis, enabled=False)

        result = await cache.get("model-a", "text")
        assert result is None
        mock_redis.get.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_get_redis_error_falls_back_to_none(self):
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(side_effect=ConnectionError("Redis connection refused"))

        cache = EmbeddingCache(redis_client=mock_redis, enabled=True)
        result = await cache.get("model-a", "text")

        assert result is None  # Graceful fallback, no exception raised


class TestEmbeddingCacheGetMany:
    @pytest.mark.asyncio
    async def test_get_many_mixed(self):
        mock_redis = AsyncMock()
        mock_redis.mget = AsyncMock(
            return_value=[
                json.dumps([0.1, 0.2]),
                None,
                json.dumps([0.3, 0.4]),
            ]
        )

        cache = EmbeddingCache(redis_client=mock_redis, enabled=True)
        results = await cache.get_many("model-a", ["text1", "text2", "text3"])

        assert len(results) == 3
        assert results[0] == [0.1, 0.2]
        assert results[1] is None
        assert results[2] == [0.3, 0.4]

    @pytest.mark.asyncio
    async def test_get_many_empty(self):
        mock_redis = AsyncMock()
        cache = EmbeddingCache(redis_client=mock_redis, enabled=True)

        results = await cache.get_many("model-a", [])
        assert results == []
        mock_redis.mget.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_get_many_redis_error_fallback(self):
        mock_redis = AsyncMock()
        mock_redis.mget = AsyncMock(side_effect=TimeoutError("Redis timed out"))

        cache = EmbeddingCache(redis_client=mock_redis, enabled=True)
        results = await cache.get_many("model-a", ["t1", "t2"])

        assert results == [None, None]


class TestEmbeddingCacheSet:
    @pytest.mark.asyncio
    async def test_set_success(self):
        mock_redis = AsyncMock()
        mock_redis.set = AsyncMock()

        cache = EmbeddingCache(redis_client=mock_redis, default_ttl=3600, enabled=True)
        await cache.set("model-a", "text", [0.1, 0.2])

        mock_redis.set.assert_awaited_once()
        args, kwargs = mock_redis.set.call_args
        assert kwargs.get("ex") == 3600
        assert json.loads(args[1]) == [0.1, 0.2]

    @pytest.mark.asyncio
    async def test_set_disabled(self):
        mock_redis = AsyncMock()
        cache = EmbeddingCache(redis_client=mock_redis, enabled=False)

        await cache.set("model-a", "text", [0.1, 0.2])
        mock_redis.set.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_set_redis_error_handled(self):
        mock_redis = AsyncMock()
        mock_redis.set = AsyncMock(side_effect=ConnectionError("Redis down"))

        cache = EmbeddingCache(redis_client=mock_redis, enabled=True)
        # Should not raise:
        await cache.set("model-a", "text", [0.1, 0.2])


class TestEmbeddingCacheSetMany:
    @pytest.mark.asyncio
    async def test_set_many_pipeline(self):
        mock_redis = AsyncMock()
        mock_pipe = MagicMock()
        mock_pipe.set = MagicMock()
        mock_pipe.execute = AsyncMock()
        mock_redis.pipeline = MagicMock(return_value=mock_pipe)

        cache = EmbeddingCache(redis_client=mock_redis, default_ttl=7200, enabled=True)
        items = [
            ("t1", [0.1, 0.2]),
            ("t2", [0.3, 0.4]),
        ]
        await cache.set_many("model-a", items)

        assert mock_pipe.set.call_count == 2
        mock_pipe.execute.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_set_many_empty(self):
        mock_redis = AsyncMock()
        cache = EmbeddingCache(redis_client=mock_redis, enabled=True)

        await cache.set_many("model-a", [])
        mock_redis.pipeline.assert_not_called()

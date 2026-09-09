"""
Redis embedding cache module.

Caches text embeddings keyed by model name and SHA-256 hash of the input text
(after task-specific instruction prefixes have been applied).

Supports:
  - Atomic single vector get/set
  - Batch MGET and pipeline SETEX for batch embedding operations
  - Graceful degradation: all Redis errors are logged as warnings and fall back
    to cache misses so inference is never blocked if Redis is down.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

import structlog

from app.config import settings

logger = structlog.get_logger()


class EmbeddingCache:
    """Redis-backed vector embedding cache."""

    def __init__(
        self,
        redis_client: Any | None = None,
        default_ttl: int | None = None,
        enabled: bool | None = None,
    ) -> None:
        self._redis = redis_client
        self._default_ttl = (
            default_ttl if default_ttl is not None else settings.EMBEDDING_CACHE_TTL
        )
        self._enabled = (
            enabled if enabled is not None else settings.EMBEDDING_CACHE_ENABLED
        )

    def _get_client(self) -> Any | None:
        if self._redis is None:
            try:
                from app.dependencies import get_redis_client  # noqa: PLC0415

                self._redis = get_redis_client()
            except Exception as exc:
                logger.warning(
                    "embedding_cache.redis_client_init_failed",
                    error=str(exc),
                )
                return None
        return self._redis

    @staticmethod
    def build_key(model_name: str, text: str) -> str:
        """Generate a deterministic Redis key for a given model and text."""
        text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return f"embed:{model_name}:{text_hash}"

    async def get(self, model_name: str, text: str) -> list[float] | None:
        """Look up a single embedding from cache."""
        if not self._enabled:
            return None

        client = self._get_client()
        if client is None:
            return None

        key = self.build_key(model_name, text)
        try:
            val = await client.get(key)
            if val is not None:
                logger.debug("embedding_cache.hit", key=key)
                return json.loads(val)
        except Exception as exc:
            logger.warning("embedding_cache.get_error", key=key, error=str(exc))

        return None

    async def get_many(
        self, model_name: str, texts: list[str]
    ) -> list[list[float] | None]:
        """Look up multiple embeddings in a single batch MGET.

        Returns a list of equal length to ``texts`` where hits contain the
        cached vector and misses contain ``None``.
        """
        if not self._enabled or not texts:
            return [None] * len(texts)

        client = self._get_client()
        if client is None:
            return [None] * len(texts)

        keys = [self.build_key(model_name, t) for t in texts]
        try:
            cached_values = await client.mget(keys)
            results: list[list[float] | None] = []
            hits = 0
            for val in cached_values:
                if val is not None:
                    try:
                        results.append(json.loads(val))
                        hits += 1
                        continue
                    except (json.JSONDecodeError, ValueError):
                        pass
                results.append(None)

            logger.debug(
                "embedding_cache.mget_completed",
                total=len(texts),
                hits=hits,
                misses=len(texts) - hits,
            )
            return results
        except Exception as exc:
            logger.warning(
                "embedding_cache.get_many_error", count=len(texts), error=str(exc)
            )
            return [None] * len(texts)

    async def set(
        self,
        model_name: str,
        text: str,
        embedding: list[float],
        ttl: int | None = None,
    ) -> None:
        """Store a single embedding vector in Redis with TTL expiration."""
        if not self._enabled:
            return

        client = self._get_client()
        if client is None:
            return

        key = self.build_key(model_name, text)
        _ttl = ttl if ttl is not None else self._default_ttl
        try:
            serialized = json.dumps(embedding)
            await client.set(key, serialized, ex=_ttl)
        except Exception as exc:
            logger.warning("embedding_cache.set_error", key=key, error=str(exc))

    async def set_many(
        self,
        model_name: str,
        items: list[tuple[str, list[float]]],
        ttl: int | None = None,
    ) -> None:
        """Store multiple embeddings in Redis using a pipeline."""
        if not self._enabled or not items:
            return

        client = self._get_client()
        if client is None:
            return

        _ttl = ttl if ttl is not None else self._default_ttl
        try:
            pipe = client.pipeline(transaction=False)
            for text, embedding in items:
                key = self.build_key(model_name, text)
                pipe.set(key, json.dumps(embedding), ex=_ttl)
            await pipe.execute()
            logger.debug("embedding_cache.set_many_completed", count=len(items))
        except Exception as exc:
            logger.warning(
                "embedding_cache.set_many_error", count=len(items), error=str(exc)
            )

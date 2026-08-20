import time
from collections import defaultdict
import structlog

from app.exceptions import RateLimitExceededError

logger = structlog.get_logger()


class SlidingWindowRateLimiter:
    """Sliding window rate limiter with in-memory store and optional Redis integration."""

    def __init__(self, default_limit: int = 60, window_seconds: int = 60, redis_client=None):
        self.default_limit = default_limit
        self.window_seconds = window_seconds
        self.redis = redis_client
        self._memory_buckets: dict[str, list[float]] = defaultdict(list)

    async def acquire(self, key: str, limit: int | None = None, cost: int = 1) -> bool:
        """Acquire tokens or raise RateLimitExceededError if rate limit is exceeded."""
        max_requests = limit or self.default_limit
        now = time.time()
        window_start = now - self.window_seconds

        if self.redis:
            try:
                pipe = self.redis.pipeline()
                pipe.zremrangebyscore(key, 0, window_start)
                pipe.zcard(key)
                pipe.zadd(key, {str(now): now})
                pipe.expire(key, self.window_seconds)
                results = await pipe.execute()
                current_count = results[1]

                if current_count >= max_requests:
                    logger.warning("rate_limit_exceeded", key=key, count=current_count, limit=max_requests)
                    raise RateLimitExceededError(f"Rate limit of {max_requests} req/{self.window_seconds}s exceeded for {key}")
                return True
            except RateLimitExceededError:
                raise
            except Exception as e:
                logger.warning("redis_rate_limit_error_fallback_to_memory", error=str(e))

        # In-memory fallback
        timestamps = self._memory_buckets[key]
        # Remove expired timestamps
        self._memory_buckets[key] = [t for t in timestamps if t > window_start]

        if len(self._memory_buckets[key]) + cost > max_requests:
            logger.warning("rate_limit_exceeded_memory", key=key, count=len(self._memory_buckets[key]), limit=max_requests)
            raise RateLimitExceededError(f"Rate limit of {max_requests} req/{self.window_seconds}s exceeded for {key}")

        for _ in range(cost):
            self._memory_buckets[key].append(now)
        return True

    def is_allowed(self, key: str, limit: int | None = None) -> bool:
        """Non-raising check if request is within limits."""
        max_requests = limit or self.default_limit
        now = time.time()
        window_start = now - self.window_seconds
        timestamps = self._memory_buckets.get(key, [])
        valid_timestamps = [t for t in timestamps if t > window_start]
        return len(valid_timestamps) < max_requests

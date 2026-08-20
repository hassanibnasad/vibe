import time

import redis.asyncio as aioredis
from fastapi import HTTPException, status


class RedisRateLimiter:
    """Token bucket / sliding window rate limiter backed by Redis."""

    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client

    async def check_rate_limit(
        self, key: str, max_requests: int, window_seconds: int = 60
    ) -> bool:
        current_time = int(time.time())
        window_key = f"ratelimit:{key}:{current_time // window_seconds}"

        count = await self.redis.incr(window_key)
        if count == 1:
            await self.redis.expire(window_key, window_seconds * 2)

        if count > max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds}s.",
            )
        return True

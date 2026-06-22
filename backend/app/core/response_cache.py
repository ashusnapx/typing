"""Server-side response caching for high-traffic read endpoints.

Uses Redis (with local in-memory fallback) to cache API responses.
Reduces database load for leaderboard, dashboard, analytics, and passage data.

Cache keys are auto-invalidated when related data changes.
"""
import time
import json
import hashlib
from typing import Optional, Any, Callable, Awaitable
from collections import OrderedDict

from app.core.cache import cache


class ResponseCache:
    TTL_DASHBOARD = 180
    TTL_LEADERBOARD = 120
    TTL_ANALYTICS = 300
    TTL_PASSAGE_LIST = 300
    TTL_PASSAGE_RANDOM = 600
    TTL_USER_PROFILE = 60

    _local_cache: OrderedDict[str, tuple[float, Any]] = OrderedDict()
    _LOCAL_MAX = 500

    async def get(self, key: str) -> Optional[Any]:
        data = await cache.get(self._ck(key))
        if data is not None:
            return data
        return self._local_get(key)

    async def set(self, key: str, value: Any, ttl: int = 60) -> None:
        await cache.set(self._ck(key), value, ttl=ttl)
        self._local_set(key, value, ttl)

    async def invalidate(self, key: str) -> None:
        await cache.delete(self._ck(key))
        self._local_cache.pop(key, None)

    async def invalidate_prefix(self, prefix: str) -> None:
        client = await cache.get_client()
        if client:
            cursor = 0
            pattern = self._ck(f"{prefix}*")
            while True:
                cursor, keys = await client.scan(cursor=cursor, match=pattern, count=100)
                if keys:
                    await client.delete(*keys)
                if cursor == 0:
                    break
        self._local_cache = OrderedDict(
            (k, v) for k, v in self._local_cache.items()
            if not k.startswith(prefix)
        )

    async def get_or_compute(
        self,
        key: str,
        ttl: int,
        factory: Callable[[], Awaitable[Any]],
    ) -> Any:
        cached = await self.get(key)
        if cached is not None:
            return cached
        value = await factory()
        await self.set(key, value, ttl)
        return value

    def cache_key(self, *parts: str) -> str:
        return hashlib.md5(":".join(parts).encode()).hexdigest()

    def _ck(self, key: str) -> str:
        return f"rc:{key}"

    def _local_get(self, key: str) -> Optional[Any]:
        if key in self._local_cache:
            expiry, value = self._local_cache[key]
            if time.time() < expiry:
                return value
            del self._local_cache[key]
        return None

    def _local_set(self, key: str, value: Any, ttl: int) -> None:
        self._local_cache[key] = (time.time() + ttl, value)
        self._local_cache.move_to_end(key)
        while len(self._local_cache) > self._LOCAL_MAX:
            self._local_cache.popitem(last=False)


response_cache = ResponseCache()

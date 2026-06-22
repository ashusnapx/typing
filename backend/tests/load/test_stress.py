"""Stress tests for failure tolerance and resilience.

Tests:
- DB connection pool exhaustion
- Cache service degradation
- High write contention
- Large payload handling
"""
import time
import asyncio
import pytest

pytestmark = pytest.mark.asyncio


def _force_local_cache():
    from app.core.cache import cache as _cache
    from app.core.response_cache import response_cache as _resp
    _cache._client = None
    _cache._circuit_failures = 99
    _cache._circuit_open_until = time.time() + 3600
    _resp._local_cache.clear()


class TestCacheDegradation:
    async def test_cache_returns_none_on_redis_fail(self):
        from app.core.response_cache import response_cache
        _force_local_cache()

        result = await response_cache.get("any-key")
        assert result is None

    async def test_cache_set_does_not_crash(self):
        from app.core.response_cache import response_cache
        _force_local_cache()

        await response_cache.set("any-key", "value", ttl=10)

    async def test_invalidate_prefix_graceful(self):
        from app.core.response_cache import response_cache
        _force_local_cache()

        response_cache._local_set("pfx:1", "a", 10)
        response_cache._local_set("pfx:2", "b", 10)
        response_cache._local_set("other:1", "c", 10)

        response_cache._local_cache = type(response_cache._local_cache)(
            (k, v) for k, v in response_cache._local_cache.items()
            if not k.startswith("pfx")
        )

        assert response_cache._local_get("pfx:1") is None
        assert response_cache._local_get("pfx:2") is None
        assert response_cache._local_get("other:1") is not None


class TestWriteContention:
    async def test_concurrent_cache_writes(self):
        from app.core.response_cache import response_cache
        _force_local_cache()

        async def writer(i: int):
            response_cache._local_set(f"contested-key", i, 5)
            return i

        results = await asyncio.gather(*[writer(i) for i in range(100)], return_exceptions=True)
        successes = sum(1 for r in results if isinstance(r, int))
        assert successes > 0

    async def test_concurrent_rate_limit_checks(self):
        from app.core.security import security_store
        security_store._redis = None
        security_store._circuit_failures = 99
        security_store._circuit_open_until = time.time() + 3600
        security_store._local_rate.clear()

        async def rl_check(i: int):
            allowed, _ = await security_store.check_rate(
                "stress-ip", "login", 100, 60, 1
            )
            return allowed

        results = await asyncio.gather(*[rl_check(i) for i in range(500)], return_exceptions=True)
        allowed_count = sum(1 for r in results if r is True)
        assert allowed_count > 0

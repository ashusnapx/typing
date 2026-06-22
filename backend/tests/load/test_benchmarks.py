"""Performance regression benchmarks.

Each test measures the time of a specific operation and asserts
it stays within acceptable bounds. Fails if a regression is detected.
"""
import time
import pytest
from app.core.response_cache import response_cache
from app.core.security import security_store

pytestmark = pytest.mark.asyncio


def _force_local_cache():
    from app.core.cache import cache as _cache
    _cache._client = None
    _cache._circuit_failures = 99
    _cache._circuit_open_until = time.time() + 3600


class TestCachePerformance:
    async def test_cache_set_get_roundtrip(self):
        _force_local_cache()
        response_cache._local_cache.clear()

        await response_cache.set("bench:perf", {"data": "x" * 1000}, ttl=10)
        start = time.perf_counter()
        val = await response_cache.get("bench:perf")
        elapsed = (time.perf_counter() - start) * 1000
        assert val is not None
        assert elapsed < 100, f"Cache get took {elapsed:.1f}ms (limit 100ms)"

    async def test_cache_invalidate_latency(self):
        _force_local_cache()
        response_cache._local_cache.clear()

        for i in range(100):
            response_cache._local_set(f"bench:bulk:{i}", i, 60)

        start = time.perf_counter()
        for i in range(100):
            response_cache._local_cache.pop(f"bench:bulk:{i}", None)
        elapsed = (time.perf_counter() - start) * 1000
        assert elapsed < 500, f"Bulk invalidate took {elapsed:.1f}ms (limit 500ms)"

    async def test_get_or_compute_caches_result(self):
        _force_local_cache()
        response_cache._local_cache.clear()

        compute_count = 0

        async def expensive():
            nonlocal compute_count
            compute_count += 1
            return {"result": 42}

        r1 = await response_cache.get_or_compute("bench:compute", 60, expensive)
        r2 = await response_cache.get_or_compute("bench:compute", 60, expensive)

        assert r1 == r2
        assert compute_count == 1


class TestRateLimitPerformance:
    async def test_rate_check_under_limit(self):
        security_store._redis = None
        security_store._circuit_failures = 99
        security_store._circuit_open_until = time.time() + 3600
        security_store._local_rate.clear()

        start = time.perf_counter()
        for _ in range(10):
            await security_store.check_rate("perf-ip", "test", 100, 60, 1)
        elapsed = (time.perf_counter() - start) * 1000
        assert elapsed < 500, f"10 rate checks took {elapsed:.1f}ms (limit 500ms)"


class TestTokenOperationPerformance:
    async def test_blacklist_check(self):
        security_store._redis = None
        security_store._circuit_failures = 99
        security_store._circuit_open_until = time.time() + 3600
        security_store._local_blacklist.clear()

        for i in range(500):
            await security_store.blacklist_token(f"perf:jti:{i}", time.time() + 3600)

        start = time.perf_counter()
        results = []
        for i in range(500):
            results.append(await security_store.is_token_blacklisted(f"perf:jti:{i}"))
        elapsed = (time.perf_counter() - start) * 1000
        assert all(results)
        assert elapsed < 2000, f"500 blacklist checks took {elapsed:.1f}ms (limit 2000ms)"


class TestRefreshTokenPerformance:
    async def test_store_and_consume(self):
        security_store._redis = None
        security_store._circuit_failures = 99
        security_store._circuit_open_until = time.time() + 3600
        security_store._local_refresh_tokens.clear()

        hashes = [f"perf:rt:{i}" for i in range(500)]

        start = time.perf_counter()
        for h in hashes:
            await security_store.store_refresh_token(h, f"user-{h}", 3600)
        store_time = (time.perf_counter() - start) * 1000
        assert store_time < 2000, f"500 store ops took {store_time:.1f}ms (limit 2000ms)"

        start = time.perf_counter()
        for h in hashes:
            await security_store.consume_refresh_token(h)
        consume_time = (time.perf_counter() - start) * 1000
        assert consume_time < 2000, f"500 consume ops took {consume_time:.1f}ms (limit 2000ms)"


class TestSecurityCircuitBreaker:
    async def test_circuit_breaker_overhead(self):
        security_store._redis = None
        security_store._circuit_failures = 99
        security_store._circuit_open_until = time.time() + 3600

        start = time.perf_counter()
        for _ in range(100):
            r = await security_store._r()
        elapsed = (time.perf_counter() - start) * 1000
        assert elapsed < 500, f"100 circuit-breaker checks took {elapsed:.1f}ms (limit 500ms)"

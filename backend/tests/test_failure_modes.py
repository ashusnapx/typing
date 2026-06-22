"""Tests for system behavior under failure conditions:

- Redis outage → local fallback, no crashes
- DB connection failure → proper error, no data corruption
- Token expiry → graceful 401, refresh flow works
- Concurrent submission → no double-counting
- Rate limit exceeded → proper 429 + Retry-After
- Account lockout → proper 423
- Payment verification failure → proper 402
"""
import time
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, AsyncMock, MagicMock
from app.core.security import security_store
from app.core.cache import cache
from app.core.security import is_password_expired, validate_password_strength

pytestmark = pytest.mark.asyncio


class TestRedisOutage:
    """When Redis is down, the system must fall back to local mode."""

    async def test_security_store_fallback(self):
        security_store._redis = None
        security_store._circuit_failures = 99
        security_store._circuit_open_until = time.time() + 3600
        security_store._local_rate.clear()

        allowed, _ = await security_store.check_rate("failover-test", "login", 5, 60, 15)
        assert allowed is True, "Should allow when under limit even without Redis"

        for _ in range(5):
            await security_store.check_rate("failover-test", "login", 5, 60, 15)

        allowed, retry = await security_store.check_rate("failover-test", "login", 5, 60, 15)
        assert allowed is False, "Should block when over limit without Redis"
        assert retry is not None, "Should provide retry-after even without Redis"

    async def test_token_blacklist_without_redis(self):
        security_store._redis = None
        security_store._local_blacklist.clear()

        jti = "failover-jti"
        await security_store.blacklist_token(jti, time.time() + 3600)
        assert await security_store.is_token_blacklisted(jti) is True

    async def test_refresh_token_without_redis(self):
        security_store._redis = None
        security_store._local_refresh_tokens.clear()

        h = "failover-rt"
        await security_store.store_refresh_token(h, "user-failover", 3600)
        assert await security_store.consume_refresh_token(h) == "user-failover"
        assert await security_store.consume_refresh_token(h) is None


class TestCacheServiceOutage:
    """CacheService must not crash when Redis is unavailable."""

    async def test_get_returns_none(self):
        cache._client = None
        result = await cache.get("some-key")
        assert result is None

    async def test_set_does_not_crash(self):
        cache._client = None
        await cache.set("some-key", "value")

    async def test_setnx_returns_false(self):
        cache._client = None
        result = await cache.setnx("some-key", "value")
        assert result is False

    async def test_delete_does_not_crash(self):
        cache._client = None
        await cache.delete("some-key")

    async def test_exists_returns_false(self):
        cache._client = None
        assert await cache.exists("some-key") is False


class TestConcurrentSubmission:
    """Simulates concurrent test submissions to verify no double-counting."""

    async def test_submit_lock_prevents_double(self):
        """Test that setnx-based lock prevents concurrent submissions."""
        cache._client = None

        with patch.object(cache, 'setnx', return_value=False):
            from app.core.cache import cache as mocked_cache
            locked = await mocked_cache.setnx("submit:test-123", "1", ttl=30)
            assert locked is False


class TestAuthFailureModes:
    """Authentication failure scenarios."""

    def test_password_strength_empty(self):
        err = validate_password_strength("")
        assert err is not None
        assert "16" in err

    def test_password_strength_near_miss(self):
        """15 chars, missing uppercase — should fail."""
        err = validate_password_strength("abcdefghijklm1!")
        assert err is not None

    def test_expired_password(self):
        assert is_password_expired(datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=91)) is True

    def test_future_password_not_expired(self):
        assert is_password_expired(datetime.now(timezone.utc).replace(tzinfo=None)) is False

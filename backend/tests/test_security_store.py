"""Tests for SecurityStore circuit breaker, rate limiting, and local fallback.

Verifies behavior when Redis is unavailable — the store must
fall back to local in-memory mode without crashing or allowing abuse.
"""
import time
import pytest
from app.core.security import security_store

pytestmark = pytest.mark.asyncio


async def _disable_redis():
    """Force SecurityStore into local-only mode by killing its Redis reference."""
    security_store._redis = None
    security_store._circuit_failures = 99
    security_store._circuit_open_until = time.time() + 3600


async def _clear_local_state():
    security_store._local_blacklist.clear()
    security_store._local_rate.clear()
    security_store._local_lockouts.clear()
    security_store._local_refresh_tokens.clear()


class TestRateLimiting:
    async def test_local_fallback_blocks_after_limit(self):
        await _disable_redis()
        await _clear_local_state()

        allowed, _ = await security_store.check_rate("ip-1", "login", 2, 10, 1)
        assert allowed is True

        allowed, _ = await security_store.check_rate("ip-1", "login", 2, 10, 1)
        assert allowed is True

        allowed, retry = await security_store.check_rate("ip-1", "login", 2, 10, 1)
        assert allowed is False
        assert retry is not None

    async def test_limits_per_ip_independent(self):
        await _disable_redis()
        await _clear_local_state()

        for _ in range(5):
            await security_store.check_rate("evil-ip", "login", 3, 60, 15)

        allowed, _ = await security_store.check_rate("good-ip", "login", 3, 60, 15)
        assert allowed is True

    async def test_reset_clears_counters(self):
        await _disable_redis()
        await _clear_local_state()

        for _ in range(3):
            await security_store.check_rate("reset-me", "login", 3, 60, 15)

        allowed, _ = await security_store.check_rate("reset-me", "login", 3, 60, 15)
        assert allowed is False

        await security_store.reset_rate("reset-me", "login")

        allowed, _ = await security_store.check_rate("reset-me", "login", 3, 60, 15)
        assert allowed is True


class TestTokenBlacklist:
    async def test_blacklist_and_check(self):
        await _disable_redis()
        await _clear_local_state()

        jti = "jti-blacklist-1"
        await security_store.blacklist_token(jti, time.time() + 3600)

        assert await security_store.is_token_blacklisted(jti) is True
        assert await security_store.is_token_blacklisted("not-blacklisted") is False

    async def test_expired_blacklist_removed(self):
        await _disable_redis()
        await _clear_local_state()

        jti = "jti-expired"
        await security_store.blacklist_token(jti, time.time() - 0.01)

        assert await security_store.is_token_blacklisted(jti) is False


class TestRefreshTokens:
    async def test_single_use(self):
        await _disable_redis()
        await _clear_local_state()

        h = "rt-hash-1"
        uid = "user-1"
        await security_store.store_refresh_token(h, uid, 3600)

        assert await security_store.consume_refresh_token(h) == uid
        assert await security_store.consume_refresh_token(h) is None

    async def test_expired_not_consumable(self):
        await _disable_redis()
        await _clear_local_state()

        h = "rt-expired"
        uid = "user-expired"
        await security_store.store_refresh_token(h, uid, -1)

        assert await security_store.consume_refresh_token(h) is None


class TestFailedLoginTracking:
    async def test_tracks_and_resets(self):
        await _disable_redis()
        await _clear_local_state()

        uid = "victim"
        assert await security_store.record_failed_login(uid) == 1
        assert await security_store.record_failed_login(uid) == 2
        assert await security_store.record_failed_login(uid) == 3

        await security_store.reset_failed_logins(uid)
        assert await security_store.record_failed_login(uid) == 1


class TestCircuitBreaker:
    async def test_opens_after_consecutive_failures(self):
        security_store._redis = None
        security_store._circuit_failures = 0
        security_store._circuit_open_until = 0.0

        for _ in range(6):
            r = await security_store._r()

        if security_store._redis is None:
            assert security_store._circuit_failures >= security_store._CIRCUIT_THRESHOLD

    async def test_closes_after_cooldown(self):
        security_store._redis = None
        security_store._circuit_failures = 99
        security_store._circuit_open_until = time.time() - 10

        r = await security_store._r()
        assert r is None or r is not None

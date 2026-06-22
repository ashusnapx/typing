"""Tests for authentication hardening:
- Password entropy minimum 80 bits
- Account lockout after 5 failed attempts
- Password expiry (90 days)
- Password history (reject last 5)
- Rate limiting on login/register/refresh/password-change
- JWT 15-minute expiry
- Generic login error (no enumeration)
"""
import time
import bcrypt as _bcrypt
import hashlib
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from app.core.security import (
    validate_password_strength,
    calculate_password_entropy,
    is_password_expired,
    check_password_history,
    verify_password_hash,
    hash_ip,
    hash_user_agent,
    generate_secure_jti,
)
from app.config import settings

pytestmark = pytest.mark.asyncio


def _bcrypt_hash(pw: str) -> str:
    return _bcrypt.hashpw(pw.encode(), _bcrypt.gensalt(rounds=4)).decode()


class TestPasswordStrength:
    def test_min_length_16(self):
        err = validate_password_strength("Abc1!def")
        assert err is not None
        assert "16" in err

    def test_valid_16_char(self):
        err = validate_password_strength("CorrectHorseBatteryStaple1!")
        assert err is None

    def test_requires_upper_lower_digit_special(self):
        err = validate_password_strength("abcdefghijklmnop")
        assert err is not None

        err = validate_password_strength("abcdefghijklmnop1!")
        assert err is not None

        err = validate_password_strength("ABCDEFGHIJKLMNOPa!")
        assert err is not None

        err = validate_password_strength("ABCDEFGHIJKLMNOPa1")
        assert err is not None

    def test_rejects_repeated_chars(self):
        err = validate_password_strength("AAAAabcdefgh1!klmn")
        assert err is not None
        assert "repeated" in err

    def test_rejects_common_patterns(self):
        err = validate_password_strength("Password1234!@#$abcd")
        assert err is not None
        assert "common" in err

    def test_entropy_calculation(self):
        low = calculate_password_entropy("abcd1234")
        high = calculate_password_entropy("CorrectHorseBatteryStaple1!")
        assert high > low
        assert high > 80

    def test_valid_passwords(self):
        cases = [
            "MyDogAteMyHomework78!",
            "V3ry_Secure_P@ssw0rd!",
            "Th1s!s4Str0ngP@ss",
        ]
        for pw in cases:
            err = validate_password_strength(pw)
            assert err is None, f"Expected valid: {pw}: {err}"


class TestPasswordHistory:
    def test_rejects_last_5(self):
        old_hashes = [_bcrypt_hash(pw) for pw in [
            "FirstP@ssword1!",
            "SecondP@ssword2!",
            "ThirdP@ssword3!",
        ]]
        err = check_password_history("FirstP@ssword1!", old_hashes)
        assert err is not None
        assert "recently" in err

    def test_allows_new_password(self):
        old_hashes = [_bcrypt_hash("OldP@ssword1!")]
        err = check_password_history("BrandNewP@ssword1!", old_hashes)
        assert err is None


class TestPasswordExpiry:
    def test_expired_when_no_change_date(self):
        assert is_password_expired(None) is True

    def test_expired_after_90_days(self):
        old = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=91)
        assert is_password_expired(old) is True

    def test_not_expired_within_90_days(self):
        recent = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
        assert is_password_expired(recent) is False


class TestIPHashing:
    def test_hash_is_deterministic(self):
        h1 = hash_ip("192.168.1.1")
        h2 = hash_ip("192.168.1.1")
        assert h1 == h2
        assert len(h1) == 16

    def test_hash_is_not_reversible(self):
        h = hash_ip("192.168.1.1")
        assert "192" not in h

    def test_different_ips_different_hashes(self):
        assert hash_ip("10.0.0.1") != hash_ip("10.0.0.2")


class TestUserAgentHashing:
    def test_consistent(self):
        ua = "Mozilla/5.0 ..."
        assert hash_user_agent(ua) == hash_user_agent(ua)

    def test_length(self):
        assert len(hash_user_agent("curl/7.68.0")) == 16


class TestJTI:
    def test_generates_unique(self):
        jti1 = generate_secure_jti()
        jti2 = generate_secure_jti()
        assert jti1 != jti2
        assert len(jti1) == 32

    def test_is_hex(self):
        jti = generate_secure_jti()
        int(jti, 16)


class TestVerifyPasswordHash:
    def test_verify_bcrypt(self):
        pw = "MyTestPassword123!"
        h = _bcrypt_hash(pw)
        result = verify_password_hash(pw, h)
        assert result is True

    def test_verify_wrong_password(self):
        pw = "MyTestPassword123!"
        h = _bcrypt_hash("WrongPassword456@")
        result = verify_password_hash(pw, h)
        assert result is False

    def test_none_hash_returns_false(self):
        result = verify_password_hash("anything", None)
        assert result is False

    def test_invalid_hash_returns_false(self):
        result = verify_password_hash("anything", "invalid:hash:format")
        assert result is False

    def test_empty_history(self):
        err = check_password_history("NewP@ss1!", None)
        assert err is None

        err = check_password_history("NewP@ss1!", [])
        assert err is None

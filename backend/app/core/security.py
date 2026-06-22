import time
import hashlib
import re
import secrets
import math
from typing import Dict, Set, Tuple, Optional, List
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from app.config import settings


class SecurityStore:
    _CIRCUIT_THRESHOLD = 3
    _CIRCUIT_RESET_SECONDS = 60

    def __init__(self):
        self._redis = None
        self._local_blacklist: Dict[str, float] = {}
        self._local_rate: Dict[str, list] = defaultdict(list)
        self._local_lockouts: Dict[str, float] = {}
        self._local_refresh_tokens: Dict[str, dict] = {}
        self._circuit_failures = 0
        self._circuit_open_until = 0.0

    async def _r(self):
        now = time.time()
        if self._circuit_failures >= self._CIRCUIT_THRESHOLD:
            if now < self._circuit_open_until:
                return None
            self._circuit_failures = 0

        if not self._redis:
            try:
                import redis.asyncio as aioredis
                self._redis = await aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                    retry_on_timeout=False,
                    health_check_interval=30,
                )
                await self._redis.ping()
                self._circuit_failures = 0
            except Exception:
                self._circuit_failures += 1
                self._circuit_open_until = now + self._CIRCUIT_RESET_SECONDS
                self._redis = None
        return self._redis

    async def blacklist_token(self, jti: str, expiry: float) -> None:
        ttl = max(1, int(expiry - time.time()))
        r = await self._r()
        if r:
            await r.setex(f"bl:{jti}", ttl, "1")
        else:
            self._local_blacklist[jti] = expiry

    async def is_token_blacklisted(self, jti: str) -> bool:
        r = await self._r()
        if r:
            return await r.exists(f"bl:{jti}") > 0
        now = time.time()
        if jti in self._local_blacklist:
            if now < self._local_blacklist[jti]:
                return True
            del self._local_blacklist[jti]
        return False

    async def check_rate(self, identifier: str, endpoint: str, max_attempts: int = 5, window_seconds: int = 60, lockout_minutes: int = 15) -> Tuple[bool, Optional[int]]:
        now = time.time()
        key = f"rl:{identifier}:{endpoint}"
        lock_key = f"lock:{identifier}:{endpoint}"

        r = await self._r()
        if r:
            lock_ttl = await r.ttl(lock_key)
            if lock_ttl > 0:
                return False, lock_ttl
            count = await r.incr(key)
            if count == 1:
                await r.expire(key, window_seconds)
            if count > max_attempts:
                await r.setex(lock_key, lockout_minutes * 60, "1")
                await r.delete(key)
                return False, lockout_minutes * 60
            return True, None

        if lock_key in self._local_lockouts:
            if now < self._local_lockouts[lock_key]:
                remaining = int(self._local_lockouts[lock_key] - now)
                return False, remaining
            del self._local_lockouts[lock_key]

        timestamps = self._local_rate[key]
        timestamps = [t for t in timestamps if now - t < window_seconds]
        self._local_rate[key] = timestamps

        if len(timestamps) >= max_attempts:
            self._local_lockouts[lock_key] = now + (lockout_minutes * 60)
            return False, lockout_minutes * 60

        timestamps.append(now)
        return True, None

    async def reset_rate(self, identifier: str, endpoint: str) -> None:
        key = f"rl:{identifier}:{endpoint}"
        lock_key = f"lock:{identifier}:{endpoint}"
        r = await self._r()
        if r:
            await r.delete(key)
            await r.delete(lock_key)
        else:
            self._local_rate.pop(key, None)
            self._local_lockouts.pop(lock_key, None)

    async def store_refresh_token(self, token_hash: str, user_id: str, ttl: int) -> None:
        r = await self._r()
        if r:
            await r.setex(f"rt:{token_hash}", ttl, user_id)
        else:
            self._local_refresh_tokens[token_hash] = {"user_id": user_id, "expiry": time.time() + ttl}

    async def consume_refresh_token(self, token_hash: str) -> Optional[str]:
        r = await self._r()
        if r:
            user_id = await r.get(f"rt:{token_hash}")
            if user_id:
                await r.delete(f"rt:{token_hash}")
                return user_id
            return None
        data = self._local_refresh_tokens.pop(token_hash, None)
        if data and data["expiry"] > time.time():
            return data["user_id"]
        return None

    async def revoke_all_user_tokens(self, user_id: str) -> None:
        r = await self._r()
        if not r:
            return
        try:
            async for key in r.scan_iter(match="rt:*"):
                val = await r.get(key)
                if val == user_id:
                    await r.delete(key)
        except Exception:
            pass

    async def record_failed_login(self, user_id: str) -> int:
        key = f"fal:{user_id}"
        r = await self._r()
        if r:
            count = await r.incr(key)
            if count == 1:
                await r.expire(key, settings.ACCOUNT_LOCKOUT_MINUTES * 60)
            return count
        now = time.time()
        lkey = f"fl_local:{user_id}"
        if lkey not in self._local_rate:
            self._local_rate[lkey] = []
        timestamps = [t for t in self._local_rate[lkey] if now - t < settings.ACCOUNT_LOCKOUT_MINUTES * 60]
        timestamps.append(now)
        self._local_rate[lkey] = timestamps
        return len(timestamps)

    async def reset_failed_logins(self, user_id: str) -> None:
        key = f"fal:{user_id}"
        r = await self._r()
        if r:
            await r.delete(key)
        else:
            lkey = f"fl_local:{user_id}"
            self._local_rate.pop(lkey, None)


security_store = SecurityStore()


def calculate_password_entropy(password: str) -> float:
    charset_size = 0
    if re.search(r'[a-z]', password):
        charset_size += 26
    if re.search(r'[A-Z]', password):
        charset_size += 26
    if re.search(r'\d', password):
        charset_size += 10
    if re.search(r'[!@#$%^&*(),.?":{}|<>_\-]', password):
        charset_size += 32
    if charset_size == 0:
        return 0.0
    return len(password) * math.log2(charset_size)


def validate_password_strength(password: Optional[str]) -> Optional[str]:
    if password is None:
        return "Password is required"
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters"
    if len(password) > settings.PASSWORD_MAX_LENGTH:
        return f"Password must be at most {settings.PASSWORD_MAX_LENGTH} characters"
    if not re.search(r'[A-Z]', password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return "Password must contain at least one digit"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-]', password):
        return "Password must contain at least one special character"
    if re.search(r'(.)\1{3,}', password):
        return "Password must not contain 4 or more repeated characters in a row"
    common_patterns = [
        "password", "123456", "qwerty", "admin", "letmein",
        "welcome", "monkey", "dragon", "master", "secret"
    ]
    if any(p in password.lower() for p in common_patterns):
        return "Password contains a common pattern"
    entropy = calculate_password_entropy(password)
    if entropy < 80:
        return "Password is not complex enough (minimum entropy 80 bits). Use more varied characters."
    return None


def sanitize_input(value: str, max_length: int = 1000) -> str:
    value = value.strip()
    value = value[:max_length]
    value = re.sub(r'[<>\'"]', '', value)
    return value


def generate_secure_jti() -> str:
    return str(secrets.token_hex(16))


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


def hash_user_agent(ua: str) -> str:
    return hashlib.sha256(ua.encode()).hexdigest()[:16]


def is_password_expired(password_changed_at: Optional[datetime]) -> bool:
    if not password_changed_at:
        return True
    if password_changed_at.tzinfo is None:
        password_changed_at = password_changed_at.replace(tzinfo=timezone.utc)
    expiry = password_changed_at + timedelta(days=settings.PASSWORD_EXPIRY_DAYS)
    return datetime.now(timezone.utc) > expiry


def check_password_history(new_password: str, password_history: Optional[List[str]]) -> Optional[str]:
    if not password_history:
        return None
    for old_hash in password_history:
        if verify_password_hash(new_password, old_hash):
            return "Password has been used recently. Choose a different password."
    return None


def verify_password_hash(password: str, hashed: str) -> bool:
    try:
        import bcrypt as _bcrypt
        return _bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False

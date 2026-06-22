import redis.asyncio as redis
from typing import Optional, Any
import json
import time
from app.config import settings


class CacheService:
    _CIRCUIT_THRESHOLD = 3
    _CIRCUIT_RESET_SECONDS = 60

    def __init__(self):
        self._client: Optional[redis.Redis] = None
        self._circuit_failures = 0
        self._circuit_open_until = 0.0

    async def get_client(self) -> Optional[redis.Redis]:
        now = time.time()
        if self._circuit_failures >= self._CIRCUIT_THRESHOLD:
            if now < self._circuit_open_until:
                return None
            self._circuit_failures = 0

        if not self._client:
            try:
                self._client = await redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True,
                    health_check_interval=30,
                )
                self._circuit_failures = 0
            except Exception:
                self._circuit_failures += 1
                self._circuit_open_until = now + self._CIRCUIT_RESET_SECONDS
                return None
        return self._client

    async def ping(self) -> bool:
        client = await self.get_client()
        if not client:
            return False
        try:
            return await client.ping()
        except Exception:
            return False

    async def get(self, key: str) -> Optional[Any]:
        client = await self.get_client()
        if not client:
            return None
        data = await client.get(key)
        if data:
            try:
                return json.loads(data)
            except (json.JSONDecodeError, TypeError):
                return data
        return None

    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        client = await self.get_client()
        if not client:
            return
        serialized = json.dumps(value, default=str)
        await client.setex(key, ttl, serialized)

    async def setnx(self, key: str, value: Any, ttl: int = 30) -> bool:
        client = await self.get_client()
        if not client:
            return False
        serialized = json.dumps(value, default=str)
        result = await client.setnx(key, serialized)
        if result:
            await client.expire(key, ttl)
        return result

    async def delete(self, key: str) -> None:
        client = await self.get_client()
        if not client:
            return
        await client.delete(key)

    async def exists(self, key: str) -> bool:
        client = await self.get_client()
        if not client:
            return False
        return await client.exists(key) > 0

    async def incr(self, key: str) -> int:
        client = await self.get_client()
        if not client:
            return 0
        return await client.incr(key)

    async def expire(self, key: str, ttl: int) -> None:
        client = await self.get_client()
        if not client:
            return
        await client.expire(key, ttl)

    async def publish(self, channel: str, message: Any) -> None:
        client = await self.get_client()
        if not client:
            return
        await client.publish(channel, json.dumps(message, default=str))

    async def add_to_set(self, key: str, value: Any) -> None:
        client = await self.get_client()
        if not client:
            return
        await client.sadd(key, json.dumps(value, default=str))

    async def get_set_members(self, key: str) -> list:
        client = await self.get_client()
        if not client:
            return []
        members = await client.smembers(key)
        result = []
        for m in members:
            try:
                result.append(json.loads(m))
            except (json.JSONDecodeError, TypeError):
                result.append(m)
        return result

    async def close(self) -> None:
        if self._client:
            await self._client.close()
            self._client = None


cache = CacheService()

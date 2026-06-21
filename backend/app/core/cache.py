import redis.asyncio as redis
from typing import Optional, Any
import json
from app.config import settings


class CacheService:
    def __init__(self):
        self._client: Optional[redis.Redis] = None

    async def get_client(self) -> redis.Redis:
        if not self._client:
            self._client = await redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30,
            )
        return self._client

    async def get(self, key: str) -> Optional[Any]:
        client = await self.get_client()
        data = await client.get(key)
        if data:
            try:
                return json.loads(data)
            except (json.JSONDecodeError, TypeError):
                return data
        return None

    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        client = await self.get_client()
        serialized = json.dumps(value, default=str)
        await client.setex(key, ttl, serialized)

    async def delete(self, key: str) -> None:
        client = await self.get_client()
        await client.delete(key)

    async def exists(self, key: str) -> bool:
        client = await self.get_client()
        return await client.exists(key) > 0

    async def incr(self, key: str) -> int:
        client = await self.get_client()
        return await client.incr(key)

    async def expire(self, key: str, ttl: int) -> None:
        client = await self.get_client()
        await client.expire(key, ttl)

    async def publish(self, channel: str, message: Any) -> None:
        client = await self.get_client()
        await client.publish(channel, json.dumps(message, default=str))

    async def add_to_set(self, key: str, value: Any) -> None:
        client = await self.get_client()
        await client.sadd(key, json.dumps(value, default=str))

    async def get_set_members(self, key: str) -> list:
        client = await self.get_client()
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

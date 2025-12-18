import json
import redis.asyncio as aioredis
from app.core.config import settings
from typing import Optional, Callable


class RedisPubSub:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.pubsub: Optional[aioredis.client.PubSub] = None
        self.subscribers: dict[str, list[Callable]] = {}

    async def connect(self):
        if not self.redis:
            self.redis = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            self.pubsub = self.redis.pubsub()

    async def disconnect(self):
        if self.pubsub:
            await self.pubsub.close()
        if self.redis:
            await self.redis.close()

    async def publish(self, channel: str, message: dict):
        if not self.redis:
            await self.connect()
        await self.redis.publish(channel, json.dumps(message))

    async def subscribe(self, channel: str, callback: Callable):
        if not self.pubsub:
            await self.connect()

        if channel not in self.subscribers:
            self.subscribers[channel] = []
            await self.pubsub.subscribe(channel)

        self.subscribers[channel].append(callback)

    async def listen(self):
        if not self.pubsub:
            await self.connect()

        async for message in self.pubsub.listen():
            if message["type"] == "message":
                channel = message["channel"]
                data = json.loads(message["data"])

                if channel in self.subscribers:
                    for callback in self.subscribers[channel]:
                        await callback(data)


redis_pubsub = RedisPubSub()

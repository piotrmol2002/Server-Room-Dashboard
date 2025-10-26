from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List
import json
import asyncio
from app.core.security import decode_access_token
from app.core.redis_pubsub import redis_pubsub

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.redis_listener_task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

        if len(self.active_connections) == 1 and not self.redis_listener_task:
            await self.start_redis_listener()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        if len(self.active_connections) == 0 and self.redis_listener_task:
            self.redis_listener_task.cancel()
            self.redis_listener_task = None

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        message_str = json.dumps(message)
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection)

    async def start_redis_listener(self):
        await redis_pubsub.subscribe("metrics_update", self.handle_metrics_update)
        self.redis_listener_task = asyncio.create_task(redis_pubsub.listen())

    async def handle_metrics_update(self, data: dict):
        await self.broadcast({
            "type": "metrics_update",
            "data": data
        })


manager = ConnectionManager()


@router.websocket("/dashboard")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    try:
        payload = decode_access_token(token)
        if payload is None:
            await websocket.close(code=1008, reason="Invalid or expired token")
            return

        await manager.connect(websocket)

        try:
            while True:
                data = await websocket.receive_text()

        except WebSocketDisconnect:
            manager.disconnect(websocket)

    except Exception as e:
        print(f"[WebSocket] Error: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass

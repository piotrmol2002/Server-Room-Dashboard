from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import List
import json
from app.core.security import decode_access_token

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        message_str = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except:
                self.active_connections.remove(connection)


manager = ConnectionManager()


@router.websocket("/dashboard")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    payload = decode_access_token(token)
    if payload is None:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message received: {data}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)

from fastapi import WebSocket
from dataclasses import dataclass
import json
import uuid

@dataclass
class ConnectionManager:
    active_connections: dict = None

    def __post_init__(self):
        if self.active_connections is None:
            self.active_connections = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        username = str(uuid.uuid4())
        self.active_connections[username] = websocket
        await self.send_message_to(websocket, json.dumps({"type": "connect", "username": username}))

    def disconnect(self, websocket: WebSocket):
        username = self.find_connection_id(websocket)
        del self.active_connections[username]
        return username

    def find_connection_id(self, websocket: WebSocket):
        val_list = list(self.active_connections.values())
        key_list = list(self.active_connections.keys())
        username = val_list.index(websocket)
        return key_list[username]

    async def send_message_to(self, ws: WebSocket, message: str):
        await ws.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

# main.py

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import json
from bson import ObjectId
from database import message_collection
from models import MessageModel
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user: str):
        await websocket.accept()
        if user not in self.active_connections:
            self.active_connections[user] = []
        self.active_connections[user].append(websocket)

    async def disconnect(self, websocket: WebSocket, user: str):
        self.active_connections[user].remove(websocket)
        if not self.active_connections[user]:
            del self.active_connections[user]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str, user: str):
        if user in self.active_connections:
            for connection in self.active_connections[user]:
                await connection.send_text(message)

connection_manager = ConnectionManager()

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await connection_manager.connect(websocket, username)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            recipient = message.get("recipient", "admin")
            message_doc = MessageModel(sender=username, recipient=recipient, message=message.get("message"))
            await message_collection.insert_one(message_doc.dict(by_alias=True))
            await connection_manager.broadcast(json.dumps({
                "sender": username,
                "message": message.get("message")
            }), recipient)
    except WebSocketDisconnect:
        await connection_manager.disconnect(websocket, username)

@app.get("/messages/{user}", response_model=List[MessageModel])
async def get_messages(user: str):
    messages = await message_collection.find({"$or": [{"sender": user}, {"recipient": user}]}).to_list(1000)
    return messages

@app.get("/admin/messages", response_model=List[MessageModel])
async def get_all_messages():
    messages = await message_collection.find().to_list(1000)
    return messages

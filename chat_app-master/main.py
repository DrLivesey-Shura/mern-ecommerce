from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import json
from database import message_collection
from models import MessageModel
import redis.asyncio as redis
import asyncio
import logging

# Redis setup
redis_client = redis.Redis(
    host='redis-12029.c15.us-east-1-4.ec2.redns.redis-cloud.com',
    port=12029,
    password='JUTnbQPfEsjIgKLzLEQKfO99krJUK9Qn',
    decode_responses=True,
    socket_timeout=60,  # Increase timeout as needed
    retry_on_timeout=True  # Retry on timeout
)

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
    await redis_client.sadd("online_users", username)
    logging.info(f"{username} connected")

    try:
        while True:
            data = await websocket.receive_text()
            logging.info(f"Received message from {username}: {data}")
            message = json.loads(data)
            recipient = message.get("recipient", "admin")

            # Insert message into database
            message_doc = MessageModel(sender=username, recipient=recipient, message=message.get("message"))
            await message_collection.insert_one(message_doc.dict(by_alias=True))

            # Broadcast message to recipient if not the sender
            if recipient != username:
                await redis_client.publish(f"chat:{recipient}", json.dumps({
                    "sender": username,
                    "recipient": recipient,
                    "message": message.get("message")
                }))
    except WebSocketDisconnect:
        logging.info(f"{username} disconnected")
    except Exception as e:
        logging.error(f"Error: {e}")
    finally:
        await connection_manager.disconnect(websocket, username)
        await redis_client.srem("online_users", username)

        try:
            await websocket.close()
        except Exception as e:
            logging.error(f"Error closing websocket for {username}: {e}")

async def chat_publisher():
    while True:
        try:
            pubsub = redis_client.pubsub()
            await pubsub.subscribe("chat:*")
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    recipient = data["recipient"]
                    logging.info(f"Publishing message to {recipient}: {data}")
                    if recipient in connection_manager.active_connections:
                        await connection_manager.broadcast(json.dumps(data), recipient)
        except redis.ConnectionError:
            logging.error("Redis connection error")
            await asyncio.sleep(5)

@app.on_event("startup")
async def startup():
    try:
        await redis_client.ping()
        logging.info("Connected to Redis")
        asyncio.create_task(chat_publisher())
    except redis.ConnectionError:
        logging.error("Redis connection error")

@app.on_event("shutdown")
async def shutdown():
    await redis_client.close()

@app.get("/messages/{user}", response_model=List[MessageModel])
async def get_messages(user: str):
    messages = await message_collection.find({"$or": [{"sender": user}, {"recipient": user}]}).to_list(1000)
    return messages

@app.get("/admin/messages", response_model=List[MessageModel])
async def get_all_messages():
    messages = await message_collection.find().to_list(1000)
    return messages

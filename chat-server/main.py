from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker
from database import SessionLocal, engine, init_db
from models import Message
import json
from dataclasses import dataclass
import uuid


@dataclass
class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict = {}

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


app = FastAPI()

connection_manager = ConnectionManager()

# WebSocket endpoint to handle incoming connections
@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await connection_manager.connect(websocket)

    try:
        async with SessionLocal() as session:
            # Fetch old messages from the database
            result = await session.execute(select(Message).order_by(Message.id))
            old_messages = result.scalars().all()

            # Send old messages to the client
            for message in old_messages:
                message_data = {
                    "sender": message.sender,
                    "recipient": message.recipient,
                    "content": message.content
                }
                await connection_manager.send_message_to(websocket, json.dumps(message_data))

            while True:
                data = await websocket.receive_text()
                print("Received: ", data)
                message_data = json.loads(data)
                sender = message_data.get("sender")
                recipient = message_data.get("recipient")
                content = message_data.get("content")

                new_message = Message(sender=sender, recipient=recipient, content=content)
                session.add(new_message)
                await session.commit()

                await connection_manager.broadcast(data)

    except WebSocketDisconnect:
        username = connection_manager.disconnect(websocket)
        await connection_manager.broadcast(f"Client #{username} left the chat")

    except Exception as e:
        print(f"Unexpected error in websocket endpoint: {e}")

    finally:
        username = connection_manager.disconnect(websocket)
        await connection_manager.broadcast(f"Client #{username} left the chat")

# Event handler to initialize the database on startup
@app.on_event("startup")
async def startup_event():
    await init_db()

# Main block to run the FastAPI application using Uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
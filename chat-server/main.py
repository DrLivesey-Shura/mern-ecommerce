from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from database import message_collection
from models import MessageModel
from connection_manager import ConnectionManager
import json
from bson import ObjectId

app = FastAPI()

connection_manager = ConnectionManager()

def convert_objectid_to_str(message):
    if '_id' in message:
        message['_id'] = str(message['_id'])
    return message

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await connection_manager.connect(websocket)

    try:
        # Fetch old messages from MongoDB
        old_messages = await message_collection.find().to_list(length=100)
        for message in old_messages:
            message = convert_objectid_to_str(message)
            await connection_manager.send_message_to(websocket, json.dumps(message))

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            sender = message_data.get("sender")
            recipient = message_data.get("recipient")
            content = message_data.get("content")

            # Create a new message and insert it into MongoDB
            new_message = MessageModel(sender=sender, recipient=recipient, content=content)
            inserted_message = await message_collection.insert_one(new_message.dict(by_alias=True))

            # Include the MongoDB generated ID in the message
            message_with_id = new_message.dict(by_alias=True)
            message_with_id['_id'] = str(inserted_message.inserted_id)

            await connection_manager.broadcast(json.dumps(message_with_id))

    except WebSocketDisconnect:
        username = connection_manager.disconnect(websocket)
        await connection_manager.broadcast(f"Client #{username} left the chat")

    except Exception as e:
        print(f"Unexpected error in websocket endpoint: {e}")

    finally:
        username = connection_manager.disconnect(websocket)
        await connection_manager.broadcast(f"Client #{username} left the chat")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

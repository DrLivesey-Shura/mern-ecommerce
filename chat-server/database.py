from motor.motor_asyncio import AsyncIOMotorClient

MONGO_DETAILS = "mongodb+srv://admin:28052002@alaeddineapi.kxaujo9.mongodb.net/test-store?retryWrites=true&w=majority" 

client = AsyncIOMotorClient(MONGO_DETAILS)

database = client["test-store"]
message_collection = database.get_collection("messages")
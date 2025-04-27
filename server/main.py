from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from core.agent import AlrisAgent
from core.models import UserCommand
import json

app = FastAPI(title="Alris Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = AlrisAgent()

@app.post("/command")
async def process_command(command: UserCommand):
    """REST endpoint for testing with Postman"""
    response = await agent.process_command(command.command)
    return response

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            command = UserCommand(command=data)
            response = await agent.process_command(command.command)
            await websocket.send_text(json.dumps(response))
    except Exception as e:
        await websocket.send_text(json.dumps({"error": str(e)}))
        await websocket.close()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"} 
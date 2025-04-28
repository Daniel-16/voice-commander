from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.agent import AlrisAgent
from core.models import UserCommand
from alris_mcp.server import AlrisMCPServer
import json
import logging
import asyncio
import threading

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("alris_fastapi.log")
    ]
)
logger = logging.getLogger("alris_fastapi")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application"""
    logger.info("Starting FastAPI application")
    mcp_server = AlrisMCPServer()
    # Run MCP server in a separate thread
    mcp_thread = threading.Thread(target=mcp_server.run, daemon=True)
    mcp_thread.start()
    app.state.mcp_server = mcp_server
    app.state.mcp_thread = mcp_thread
    logger.info("MCP server started")
    yield
    logger.info("Shutting down FastAPI application")
    logger.info("MCP server stopped")

app = FastAPI(title="Alris Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = AlrisAgent()

@app.websocket("/mcp")
async def mcp_endpoint(websocket: WebSocket):
    logger.info("Received MCP WebSocket connection")
    await app.state.mcp_server.handle_websocket(websocket)

@app.post("/command")
async def process_command(command: UserCommand):
    logger.info(f"Processing command: {command.command}")
    response = await agent.process_command(command.command)
    logger.debug(f"Command response: {response}")
    return response

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("Received general WebSocket connection")
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received WebSocket data: {data}")
            command = UserCommand(command=data)
            response = await agent.process_command(command.command)
            await websocket.send_text(json.dumps(response))
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        await websocket.send_text(json.dumps({"error": str(e)}))
        await websocket.close()

@app.get("/health")
async def health_check():
    logger.info("Health check requested")
    return {"status": "healthy", "mcp_status": "running"}
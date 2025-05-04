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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for all communication"""
    logger.info("Received WebSocket connection")
    await websocket.accept()
    
    try:
        while True:
            # Receive message
            message = await websocket.receive_text()
            logger.debug(f"Received WebSocket message: {message}")
            
            try:
                # Parse the message
                data = json.loads(message)
                message_type = data.get("type", "command")  # Default to command type
                
                if message_type == "mcp":
                    # Handle MCP-specific messages
                    await app.state.mcp_server.handle_websocket(websocket)
                else:
                    # Handle regular commands
                    command = data.get("command")
                    if not command:
                        raise ValueError("Command is required for type 'command'")
                    
                    # Process the command
                    command_obj = UserCommand(command=command)
                    response = await agent.process_command(command_obj.command)
                    
                    # Send response
                    await websocket.send_text(json.dumps({
                        "type": "response",
                        "data": response,
                        "command": command
                    }))
                    
            except json.JSONDecodeError:
                logger.error("Invalid JSON format received")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
            except ValueError as e:
                logger.error(f"Validation error: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": str(e)
                }))
            except Exception as e:
                logger.error(f"Error processing message: {e}", exc_info=True)
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": str(e)
                }))
                
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        await websocket.close()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    logger.info("Health check requested")
    
    mcp_status = "running" if app.state.mcp_thread and app.state.mcp_thread.is_alive() else "stopped"
    
    return {
        "status": "healthy",
        "components": {
            "mcp_server": {
                "status": mcp_status,
                "tools": list(app.state.mcp_server.tools.keys()) if hasattr(app.state.mcp_server, "tools") else []
            },
            "websocket": {
                "status": "available",
                "endpoint": "/ws"
            }
        },
        "version": "1.0.0"
    }
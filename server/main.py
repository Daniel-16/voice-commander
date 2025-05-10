from dotenv import load_dotenv
load_dotenv()
import logging
import json
import threading
import asyncio
import signal
import os
import sys
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uuid

from layers.langchain_agent import AgentOrchestrator
from layers.mcp_connector import MCPConnector, AlrisMCPClient
from layers.external_services import BrowserService

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("alris_server.log")
    ]
)
logger = logging.getLogger("alris_server")

mcp_client = None
mcp_thread = None
mcp_connector = None
shutdown_requested = False
shutdown_lock = threading.Lock()

def handle_sigterm(*args):
    """Handle SIGTERM signal by marking shutdown requested"""
    global shutdown_requested
    with shutdown_lock:
        shutdown_requested = True
    logger.info("Received SIGTERM signal, initiating graceful shutdown")
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for the FastAPI application"""
    global mcp_client, mcp_thread, mcp_connector
    
    logger.info("Starting Alris server with layered architecture")
    
    try:
        if mcp_connector is None:
            mcp_connector = MCPConnector()
            logger.info("MCP connector initialized")
        
        if mcp_thread is None or not mcp_thread.is_alive():
            mcp_thread = threading.Thread(target=mcp_connector.run, daemon=True)
            mcp_thread.start()
            logger.info("MCP connector server thread started")
        
        if mcp_client is None:
            mcp_client = AlrisMCPClient()
            connected = await mcp_client.connect()
            if connected:
                logger.info("MCP client connected successfully")
            else:
                logger.error("Failed to connect MCP client")
        
        agent_orchestrator = AgentOrchestrator()
        agent_orchestrator.set_mcp_client(mcp_client)
        logger.info("Agent orchestrator initialized with MCP client")
        
        app.state.mcp_connector = mcp_connector
        app.state.mcp_thread = mcp_thread
        app.state.mcp_client = mcp_client
        app.state.agent_orchestrator = agent_orchestrator
        
        yield
    finally:
        logger.info("FastAPI application shutting down")
        
        if mcp_client and hasattr(mcp_client, 'disconnect'):
            try:
                await asyncio.wait_for(mcp_client.disconnect(), timeout=3.0)
                logger.info("MCP client disconnected successfully")
                mcp_client = None
            except asyncio.TimeoutError:
                logger.warning("MCP client disconnect timed out, forcing closure")
            except Exception as e:
                logger.error(f"Error disconnecting MCP client: {str(e)}")
        
        if hasattr(mcp_connector, 'shutdown') and mcp_connector:
            try:
                await mcp_connector.shutdown()
                logger.info("MCP connector shut down successfully")
                mcp_connector = None
            except Exception as e:
                logger.error(f"Error shutting down MCP connector: {str(e)}")

        if hasattr(app.state, 'agent_orchestrator'):
            await app.state.agent_orchestrator.cleanup()

app = FastAPI(
    title="Alris Server", 
    lifespan=lifespan,
    websocket_ping_interval=None,
    websocket_ping_timeout=None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    logger.info("Received WebSocket connection")
    await websocket.accept()
    
    thread_id = str(uuid.uuid4())
    logger.debug(f"Generated thread ID for connection: {thread_id}")
    
    try:
        while True:
            message = await websocket.receive_text()
            logger.debug(f"Received WebSocket message: {message}")
            
            try:
                data = json.loads(message)
                command = data.get("command")
                
                if not command:
                    raise ValueError("Command is required")
                
                response = await app.state.agent_orchestrator.process_command(command, thread_id=thread_id)
                
                if hasattr(response, 'content'):
                    response_content = response.content
                elif isinstance(response, (list, tuple)) and len(response) > 0 and hasattr(response[-1], 'content'):
                    response_content = response[-1].content
                else:
                    response_content = str(response)
                
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "data": response_content
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
    mcp_client_status = "connected" if app.state.mcp_client and app.state.mcp_client.connected else "disconnected"
    
    return {
        "status": "healthy",
        "components": {
            "mcp_connector": {
                "status": mcp_status,
                "tools": list(app.state.mcp_connector.tools.keys()) if hasattr(app.state.mcp_connector, "tools") else []
            },
            "mcp_client": {
                "status": mcp_client_status
            },
            "agent_orchestrator": {
                "status": "initialized",
                "agents": ["BrowserAgent"]
            },
            "websocket": {
                "status": "available",
                "endpoint": "/ws"
            }
        },
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=False,
        log_level="debug"
    )
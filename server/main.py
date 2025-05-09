from dotenv import load_dotenv
load_dotenv()

import logging
import json
import threading
import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import layer components
from layers.langchain_agent import AgentOrchestrator
from layers.mcp_connector import MCPConnector, AlrisMCPClient
from layers.external_services import BrowserService

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("alris_server.log")
    ]
)
logger = logging.getLogger("alris_server")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application"""
    logger.info("Starting Alris server with layered architecture")
    
    # Initialize External Services Layer
    # (Nothing to do here as services are initialized by the MCP connector)
    
    # Initialize MCP Connector Layer (bridge between agents and services)
    mcp_connector = MCPConnector()
    
    # Run MCP server in a separate thread
    mcp_thread = threading.Thread(target=mcp_connector.run, daemon=True)
    mcp_thread.start()
    logger.info("MCP connector server started")
    
    # Initialize MCP client
    mcp_client = AlrisMCPClient()
    await mcp_client.connect()
    logger.info("MCP client connected")
    
    # Initialize LangChain Agent Layer
    agent_orchestrator = AgentOrchestrator()
    agent_orchestrator.set_mcp_client(mcp_client)
    logger.info("Agent orchestrator initialized with MCP client")
    
    # Store components in app state
    app.state.mcp_connector = mcp_connector
    app.state.mcp_thread = mcp_thread
    app.state.mcp_client = mcp_client
    app.state.agent_orchestrator = agent_orchestrator
    
    yield
    
    # Shutdown in reverse order
    logger.info("Shutting down Alris server")
    await mcp_client.disconnect()
    # MCP server thread is daemon, so it will be terminated when the main thread exits

# Initialize FastAPI app
app = FastAPI(title="Alris Server", lifespan=lifespan)

# Add CORS middleware
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
    
    try:
        while True:
            # Receive message
            message = await websocket.receive_text()
            logger.debug(f"Received WebSocket message: {message}")
            
            try:
                # Parse the message
                data = json.loads(message)
                command = data.get("command")
                
                if not command:
                    raise ValueError("Command is required")
                
                # Process command through the agent orchestrator (LangChain Agent Layer)
                # The agent will use the MCP client to execute tools via the MCP connector
                response = await app.state.agent_orchestrator.process_command(command)
                
                # Send response
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "data": response
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
import logging
import asyncio
from typing import Dict, Any, Optional
from mcp.client import MCPClient

logger = logging.getLogger("mcp_connector.client")

class AlrisMCPClient:
    """
    MCP client that connects to the MCP server and provides
    an interface for agents to call MCP tools
    """
    
    def __init__(self, host: str = "localhost", port: int = 8080):
        """Initialize the MCP client with connection details"""
        self.host = host
        self.port = port
        self.client = None
        self.connected = False
        
    async def connect(self) -> bool:
        """Connect to the MCP server"""
        try:
            logger.info(f"Connecting to MCP server at {self.host}:{self.port}")
            self.client = MCPClient()
            await self.client.connect(f"ws://{self.host}:{self.port}")
            self.connected = True
            logger.info("Connected to MCP server")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {str(e)}")
            self.connected = False
            return False
    
    async def call_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Call an MCP tool with parameters"""
        if not self.connected or not self.client:
            logger.error("Not connected to MCP server")
            return {
                "status": "error",
                "message": "Not connected to MCP server"
            }
        
        try:
            logger.info(f"Calling MCP tool: {tool_name} with params: {params}")
            result = await self.client.call_tool(tool_name, params)
            logger.info(f"MCP tool result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error calling MCP tool {tool_name}: {str(e)}")
            return {
                "status": "error",
                "message": f"Error calling MCP tool: {str(e)}"
            }
    
    async def disconnect(self):
        """Disconnect from the MCP server"""
        if self.client:
            try:
                await self.client.disconnect()
                logger.info("Disconnected from MCP server")
            except Exception as e:
                logger.error(f"Error disconnecting from MCP server: {str(e)}")
        self.connected = False
        self.client = None 
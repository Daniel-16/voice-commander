import logging
import asyncio
# from typing import Dict, Any, Optional
from mcp.client import MCPClient
from mcp.server import MCPServer

logger = logging.getLogger("mcp_connector")

class AlrisMCPClient(MCPClient):
    
    def __init__(self):
        super().__init__()
        self.connected = False
        self._cleanup_tasks = set()
    
    async def connect(self) -> bool:
        try:
            await self.start()
            self.connected = True
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {str(e)}")
            return False
    
    async def disconnect(self):
        try:
            for task in self._cleanup_tasks:
                if not task.done():
                    task.cancel()
            
            if self._cleanup_tasks:
                await asyncio.wait(self._cleanup_tasks, timeout=2.0)
            
            await self.close()
            self.connected = False
            
        except Exception as e:
            logger.error(f"Error during MCP client disconnect: {str(e)}")
        finally:
            self._cleanup_tasks.clear()

class MCPConnector:    
    def __init__(self):
        self.server = MCPServer()
        self.tools = {}
        self._running = False
        self._server_task = None
    
    def run(self):
        try:
            self._running = True
            self.server.run()
        except Exception as e:
            logger.error(f"Error running MCP server: {str(e)}")
        finally:
            self._running = False
    
    async def shutdown(self):
        try:
            self._running = False
            
            if hasattr(self.server, 'stop'):
                await self.server.stop()
            
            self.tools.clear()
            
            if self._server_task and not self._server_task.done():
                self._server_task.cancel()
                try:
                    await asyncio.wait_for(self._server_task, timeout=2.0)
                except asyncio.TimeoutError:
                    logger.warning("Server task cancellation timed out")
                except Exception as e:
                    logger.error(f"Error cancelling server task: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error during MCP connector shutdown: {str(e)}") 
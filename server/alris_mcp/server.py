from typing import Optional, Dict, Any
import sys
# import os
from pathlib import Path
import logging
import json
from fastapi import WebSocket
from mcp.server.fastmcp import FastMCP
from core.browser_controller import BrowserController
from pydantic import BaseModel
from core.state_manager import StateManager
from core.models import APITask

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("alris_mcp_server.log")
    ]
)
logger = logging.getLogger("alris_mcp_server")

server_dir = str(Path(__file__).parent.parent)
if server_dir not in sys.path:
    sys.path.append(server_dir)
    logger.debug(f"Added {server_dir} to sys.path")

class NavigateParams(BaseModel):
    url: str

class YouTubeSearchParams(BaseModel):
    search_query: str

class FormParams(BaseModel):
    form_data: Dict[str, str]
    selectors: Optional[Dict[str, str]] = None

class ClickParams(BaseModel):
    selector: str

class AlrisMCPServer:
    def __init__(self):
        logger.info("Initializing AlrisMCPServer")
        self.mcp = FastMCP("Alris Browser Automation")
        self.browser_controller = BrowserController()
        self.state_manager = StateManager()
        logger.debug("BrowserController initialized")
        self._register_tools()

    @property
    def tools(self):
        """Get list of available tools"""
        if hasattr(self.mcp, '_tool_manager'):
            return self.mcp._tool_manager._tools
        return {}

    async def navigate(self, url: str) -> Dict[str, Any]:
        """Navigate to a specified URL in the browser."""
        logger.info(f"Navigating to URL: {url}")
        try:
            await self.browser_controller.navigate(url)
            return {
                "status": "success",
                "message": f"Successfully navigated to {url}"
            }
        except Exception as e:
            logger.error(f"Navigation error: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to navigate: {str(e)}"
            }

    async def play_youtube_video(self, search_query: str) -> Dict[str, Any]:
        """Search and play a YouTube video."""
        logger.info(f"Searching YouTube for: {search_query}")
        try:
            formatted_query = search_query.replace(" ", "+")
            await self.browser_controller.navigate(f"https://www.youtube.com/results?search_query={formatted_query}")
            await self.browser_controller.click_element("a#video-title")
            return {
                "status": "success",
                "message": f"Successfully playing video for '{search_query}'"
            }
        except Exception as e:
            logger.error(f"YouTube playback error: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to play YouTube video: {str(e)}"
            }

    async def fill_form(self, form_data: Dict[str, str], selectors: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Fill form fields in the current page."""
        logger.info(f"Filling form with data: {form_data}")
        try:
            await self.browser_controller.fill_form(form_data, selectors)
            return {
                "status": "success",
                "message": "Successfully filled form fields"
            }
        except Exception as e:
            logger.error(f"Form fill error: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to fill form: {str(e)}"
            }

    async def click_element(self, selector: str) -> Dict[str, Any]:
        """Click an element on the current page."""
        logger.info(f"Clicking element with selector: {selector}")
        try:
            await self.browser_controller.click_element(selector)
            return {
                "status": "success",
                "message": f"Successfully clicked element '{selector}'"
            }
        except Exception as e:
            logger.error(f"Click error: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to click element: {str(e)}"
            }

    async def handle_api_task(self, task: APITask) -> Dict[str, Any]:
        """Handle API-based tasks"""
        logger.info(f"Handling API task: {task.endpoint}")
        try:
            return {
                "status": "success",
                "message": f"API task handled: {task.endpoint}",
                "result": {}
            }
        except Exception as e:
            logger.error(f"API task error: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to handle API task: {str(e)}"
            }

    def _register_tools(self):
        """Register all MCP tools"""
        logger.info("Registering MCP tools")

        @self.mcp.tool()
        async def navigate(url: str) -> Dict[str, Any]:
            """Navigate to a specified URL in the browser."""
            return await self.navigate(url)

        @self.mcp.tool()
        async def play_youtube_video(search_query: str) -> Dict[str, Any]:
            """Search and play a YouTube video."""
            return await self.play_youtube_video(search_query)

        @self.mcp.tool()
        async def fill_form(form_data: Dict[str, str], selectors: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
            """Fill form fields in the current page."""
            return await self.fill_form(form_data, selectors)

        @self.mcp.tool()
        async def click_element(selector: str) -> Dict[str, Any]:
            """Click an element on the current page."""
            return await self.click_element(selector)

        @self.mcp.tool()
        async def execute_api_task(task: Dict[str, Any]) -> Dict[str, Any]:
            """Execute an API task."""
            api_task = APITask(**task)
            return await self.handle_api_task(api_task)

        # Log tools
        if hasattr(self.mcp, '_tool_manager'):
            logger.info(f"MCP tools registered: {list(self.mcp._tool_manager._tools.keys())}")
        else:
            logger.warning("No tool manager found in FastMCP instance")

    async def handle_websocket(self, websocket: WebSocket):
        """Handle WebSocket connections and messages"""
        await websocket.accept()
        logger.info("WebSocket connection accepted")
        
        try:
            while True:
                message = await websocket.receive_text()
                logger.debug(f"Received WebSocket message: {message}")
                
                try:
                    data = json.loads(message)
                    if data.get("type") == "tool":
                        tool_name = data.get("name")
                        parameters = data.get("parameters", {})
                        
                        # Create task state
                        task_id = self.state_manager.create_task({
                            "tool": tool_name,
                            "parameters": parameters
                        })
                        
                        tools = await self.mcp.list_tools()
                        available_tool_names = [tool.name for tool in tools]
                        
                        if tool_name in available_tool_names:
                            try:
                                result = await self.mcp.call_tool(name=tool_name, arguments=parameters)
                                
                                # Update task state
                                self.state_manager.update_task_state(
                                    task_id,
                                    status="completed",
                                    result=result
                                )
                                
                                serializable_result = {
                                    "status": "success",
                                    "result": {
                                        "content": []
                                    }
                                }

                                if isinstance(result, dict):
                                    content_list = result.get("content", [])
                                else:
                                    content_list = result if isinstance(result, list) else []

                                for content in content_list:
                                    if hasattr(content, "text"):
                                        serializable_result["result"]["content"].append({"text": content.text})
                                    elif isinstance(content, dict) and "text" in content:
                                        serializable_result["result"]["content"].append({"text": content["text"]})
                                    else:
                                        try:
                                            json.dumps(content)
                                            serializable_result["result"]["content"].append(content)
                                        except (TypeError, ValueError):
                                            serializable_result["result"]["content"].append({"text": str(content)})
                                
                                await websocket.send_json(serializable_result)
                            except Exception as e:
                                logger.error(f"Tool execution error: {str(e)}", exc_info=True)
                                # Update task state
                                self.state_manager.update_task_state(
                                    task_id,
                                    status="error",
                                    error=str(e)
                                )
                                await websocket.send_json({
                                    "status": "error",
                                    "message": str(e)
                                })
                        else:
                            await websocket.send_json({
                                "status": "error",
                                "message": f"Unknown tool: {tool_name}. Available tools: {available_tool_names}"
                            })
                    else:
                        await websocket.send_json({
                            "status": "error",
                            "message": "Invalid message format"
                        })
                        
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "status": "error",
                        "message": "Invalid JSON message"
                    })
                except Exception as e:
                    logger.error(f"Error processing message: {str(e)}", exc_info=True)
                    await websocket.send_json({
                        "status": "error",
                        "message": str(e)
                    })
                    
        except Exception as e:
            logger.error(f"WebSocket error: {str(e)}", exc_info=True)
        finally:
            await websocket.close()
            logger.info("WebSocket connection closed")

    def run(self):
        """Run the MCP server"""
        logger.info("Starting MCP server with stdio transport")
        try:
            self.mcp.run()
        except Exception as e:
            logger.error(f"Server failed: {e}", exc_info=True)
            raise

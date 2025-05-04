from typing import Optional, Dict, Any, List
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
from core.agents import CalendarAgent, BrowserAgent, TaskAgent

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

class TaskIntent(BaseModel):
    intent_type: str
    parameters: Dict[str, Any]
    sub_tasks: List[Dict[str, Any]]

class AlrisMCPServer:
    def __init__(self):
        logger.info("Initializing AlrisMCPServer")
        self.mcp = FastMCP("Alris Command Orchestrator")
        self.browser_controller = BrowserController()
        self.state_manager = StateManager()
        
        # Initialize specialized agents
        self.task_agent = TaskAgent()
        self.calendar_agent = CalendarAgent()
        self.browser_agent = BrowserAgent()
        
        logger.debug("MCP Server and agents initialized")
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

    async def process_command(self, command: str) -> Dict[str, Any]:
        """Process user command through MCP orchestration"""
        logger.info(f"Processing command: {command}")
        try:
            # 1. Task Analysis and Intent Recognition
            task_intent = await self.task_agent.analyze_intent(command)
            
            # 2. Task Decomposition
            sub_tasks = await self.task_agent.decompose_task(task_intent)
            
            # 3. Agent Selection and Task Delegation
            results = []
            for task in sub_tasks:
                result = await self._delegate_task(task)
                results.append(result)
            
            # 4. Aggregate Results
            final_response = await self.task_agent.aggregate_results(results)
            
            return {
                "status": "success",
                "intent": task_intent.dict(),
                "response": final_response
            }
        except Exception as e:
            logger.error(f"Command processing error: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to process command: {str(e)}"
            }

    async def _delegate_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Delegate task to appropriate agent based on intent"""
        intent_type = task.get("intent_type")
        
        if intent_type == "calendar":
            return await self.calendar_agent.execute_task(task)
        elif intent_type == "browser":
            return await self.browser_agent.execute_task(task)
        else:
            raise ValueError(f"Unknown intent type: {intent_type}")

    def _register_tools(self):
        """Register MCP tools for external integrations"""
        logger.info("Registering MCP tools")

        @self.mcp.tool()
        async def process_command(command: str) -> Dict[str, Any]:
            """Process a user command through MCP orchestration"""
            return await self.process_command(command)

        @self.mcp.tool()
        async def get_task_status(task_id: str) -> Dict[str, Any]:
            """Get status of a specific task"""
            return self.state_manager.get_task_status(task_id)

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
                    command = data.get("command")
                    
                    if command:
                        response = await self.process_command(command)
                        await websocket.send_text(json.dumps(response))
                    else:
                        await websocket.send_text(json.dumps({
                            "status": "error",
                            "message": "Invalid message format"
                        }))
                        
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({
                        "status": "error",
                        "message": "Invalid JSON format"
                    }))
                    
        except Exception as e:
            logger.error(f"WebSocket error: {e}", exc_info=True)
            await websocket.close()

    def run(self):
        """Run the MCP server"""
        logger.info("Starting MCP server")
        try:
            self.mcp.run()
        except Exception as e:
            logger.error(f"MCP server error: {e}", exc_info=True)
            raise

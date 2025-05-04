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
from langchain.schema.messages import HumanMessage

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
        self.state_manager = StateManager()
        
        # Initialize specialized agents
        self.task_agent = TaskAgent()
        self.calendar_agent = CalendarAgent()
        self.browser_agent = BrowserAgent()
        
        # Initialize tools after agents
        self.browser_controller = BrowserController()
        
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
        logger.info(f"Processing command through MCP: {command}")
        task_id = None
        try:
            task_id = self.state_manager.create_task({"command": command})
            
            # formatted_command = HumanMessage(content=command)
            
            intent_result = await self.task_agent.analyze_intent(command)
            self.state_manager.update_task_state(
                task_id, 
                status="intent_analyzed",
                context={"intent": intent_result}
            )
            
            sub_tasks = await self.task_agent.decompose_task(intent_result)
            self.state_manager.update_task_state(
                task_id,
                status="tasks_decomposed",
                context={"sub_tasks": sub_tasks}
            )
            
            results = []
            for task in sub_tasks:
                try:
                    result = await self._delegate_task(task)
                    results.append(result)
                    if isinstance(result.get("message"), str):
                        self.task_agent.memory.chat_memory.add_ai_message(result["message"])
                except Exception as e:
                    logger.error(f"Task execution error: {e}", exc_info=True)
                    error_result = {
                        "status": "error",
                        "message": f"Task execution failed: {str(e)}",
                        "task": task
                    }
                    results.append(error_result)
                    self.task_agent.memory.chat_memory.add_ai_message(f"Error: {str(e)}")
            
            final_response = await self.task_agent.aggregate_results(results)
            
            self.state_manager.update_task_state(
                task_id,
                status="completed",
                result=final_response
            )
            
            return {
                "task_id": task_id,
                "status": "success",
                "intent": intent_result,
                "response": final_response
            }
            
        except Exception as e:
            logger.error(f"Command processing error: {str(e)}", exc_info=True)
            if task_id:
                self.state_manager.update_task_state(
                    task_id,
                    status="error",
                    error=str(e)
                )
            return {
                "status": "error",
                "message": f"Failed to process command: {str(e)}"
            }

    async def _delegate_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Delegate task to appropriate agent based on intent"""
        intent_type = task.get("intent_type")
        logger.info(f"Delegating task of type {intent_type}")
        
        try:
            if intent_type == "calendar":
                return await self.calendar_agent.execute_task(task)
            elif intent_type == "browser":
                return await self.browser_agent.execute_task(task)
            elif intent_type == "api":
                return await self.handle_api_task(APITask(**task))
            else:
                raise ValueError(f"Unknown intent type: {intent_type}")
        except Exception as e:
            logger.error(f"Task delegation error: {e}", exc_info=True)
            raise

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
            state = self.state_manager.get_task_state(task_id)
            return state.model_dump() if state else {"status": "not_found"}

        @self.mcp.tool()
        async def navigate(params: NavigateParams) -> Dict[str, Any]:
            """Navigate to a specified URL in the browser."""
            return await self.browser_agent.execute_task({
                "intent_type": "browser",
                "action": "navigate",
                "parameters": params.model_dump()
            })

        @self.mcp.tool()
        async def play_youtube_video(params: YouTubeSearchParams) -> Dict[str, Any]:
            """Search and play a YouTube video."""
            return await self.browser_agent.execute_task({
                "intent_type": "browser",
                "action": "play_video",
                "parameters": params.model_dump()
            })

        @self.mcp.tool()
        async def fill_form(params: FormParams) -> Dict[str, Any]:
            """Fill form fields in the current page."""
            return await self.browser_agent.execute_task({
                "intent_type": "browser",
                "action": "fill_form",
                "parameters": params.model_dump()
            })

        @self.mcp.tool()
        async def click_element(params: ClickParams) -> Dict[str, Any]:
            """Click an element on the current page."""
            return await self.browser_agent.execute_task({
                "intent_type": "browser",
                "action": "click",
                "parameters": params.model_dump()
            })

        # Log registered tools
        if hasattr(self.mcp, '_tool_manager'):
            logger.info(f"MCP tools registered: {list(self.mcp._tool_manager._tools.keys())}")
        else:
            logger.warning("No tool manager found in FastMCP instance")

    async def handle_websocket(self, websocket: WebSocket):
        """Handle WebSocket connections and messages"""
        logger.info("MCP WebSocket connection accepted")
        
        try:
            while True:
                message = await websocket.receive_text()
                logger.debug(f"Received MCP WebSocket message: {message}")
                
                try:
                    data = json.loads(message)
                    command = data.get("command")
                    
                    if command:
                        response = await self.process_command(command)
                        await websocket.send_text(json.dumps({
                            "type": "mcp_response",
                            "data": response
                        }))
                    else:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "Invalid message format: command is required"
                        }))
                        
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid JSON format"
                    }))
                except Exception as e:
                    logger.error(f"Error processing MCP message: {e}", exc_info=True)
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"Failed to process MCP command: {str(e)}"
                    }))
                    
        except Exception as e:
            logger.error(f"MCP WebSocket error: {e}", exc_info=True)
        finally:
            await websocket.close()

    def run(self):
        """Run the MCP server"""
        logger.info("Starting MCP server")
        try:
            self.mcp.run()
        except Exception as e:
            logger.error(f"MCP server error: {e}", exc_info=True)
            raise

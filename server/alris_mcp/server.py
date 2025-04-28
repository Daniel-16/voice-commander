from typing import Optional, Dict, Any
import sys
import os
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("alris_mcp_server.log")
    ]
)
logger = logging.getLogger("alris_mcp_server")

# Add the server directory to the Python path
server_dir = str(Path(__file__).parent.parent)
if server_dir not in sys.path:
    sys.path.append(server_dir)
    logger.debug(f"Added {server_dir} to sys.path")

from mcp.server.fastmcp import FastMCP
from core.browser_controller import BrowserController

class AlrisMCPServer:
    def __init__(self):
        logger.info("Initializing AlrisMCPServer")
        self.mcp = FastMCP("Alris Browser Automation")
        self.browser_controller = BrowserController()
        logger.debug("BrowserController initialized")
        self._register_tools()

    def _register_tools(self):
        logger.info("Registering MCP tools")

        @self.mcp.tool()
        async def navigate(url: str) -> Dict[str, Any]:
            """Navigate to a specified URL in the browser
            
            Args:
                url: The URL to navigate to
                
            Returns:
                Dict containing status of the navigation
            """
            logger.info(f"Navigating to URL: {url}")
            result = await self.browser_controller.execute_action({
                "url": url,
                "action": "navigate"
            })
            logger.debug(f"Navigation result: {result}")
            return {"success": result, "url": url}

        @self.mcp.tool()
        async def play_youtube_video(search_query: str) -> Dict[str, Any]:
            """Search and play a YouTube video
            
            Args:
                search_query: The search term for the video
                
            Returns:
                Dict containing status of the operation
            """
            logger.info(f"Playing YouTube video with query: {search_query}")
            result = await self.browser_controller.execute_action({
                "url": "https://youtube.com",
                "action": "play_video",
                "inputs": {"search": search_query}
            })
            logger.debug(f"YouTube video play result: {result}")
            return {"success": result, "query": search_query}

        @self.mcp.tool()
        async def fill_form(form_data: Dict[str, str], selectors: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
            """Fill form fields in the current page
            
            Args:
                form_data: Dictionary of field names and values
                selectors: Optional custom selectors for form fields
                
            Returns:
                Dict containing status of the form fill operation
            """
            logger.info(f"Filling form with data: {form_data}")
            result = await self.browser_controller.execute_action({
                "action": "fill_form",
                "inputs": form_data,
                "selectors": selectors or {}
            })
            logger.debug(f"Form fill result: {result}")
            return {"success": result, "fields": list(form_data.keys())}

        @self.mcp.tool()
        async def click_element(selector: str) -> Dict[str, Any]:
            """Click an element on the current page
            
            Args:
                selector: CSS selector for the element to click
                
            Returns:
                Dict containing status of the click operation
            """
            logger.info(f"Clicking element with selector: {selector}")
            result = await self.browser_controller.execute_action({
                "action": "click",
                "parameters": {"selector": selector}
            })
            logger.debug(f"Click result: {result}")
            return {"success": result, "selector": selector}

        logger.info("MCP tools registered")

    def run(self):
        """Run the MCP server"""
        logger.info("Starting MCP server with stdio transport")
        try:
            self.mcp.run()  # Default transport is stdio
        except Exception as e:
            logger.error(f"Server failed: {e}", exc_info=True)
            raise
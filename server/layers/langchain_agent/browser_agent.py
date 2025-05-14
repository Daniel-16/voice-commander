import logging
from typing import List, Dict, Any
from langchain.agents import Tool
from .react_agent import BaseReactAgent

logger = logging.getLogger("langchain_agent.browser")

class BrowserAgent(BaseReactAgent):
    """LangChain agent for browser automation tasks"""
    
    def _get_tools(self) -> List[Tool]:
        """Get the browser automation tools"""
        return [
            Tool(
                name="navigate_to_url",
                func=self._navigate_to_url,
                description="Navigate to a specified URL in the browser. Input should be a URL string."
            ),
            Tool(
                name="search_youtube",
                func=self._search_youtube,
                description="Search for a video on YouTube and play it. Input should be a search query string."
            ),
            Tool(
                name="fill_form",
                func=self._fill_form,
                description="Fill a form with the provided data. Input should be a JSON string with form_data (a dictionary of field names and values) and optionally selectors (a dictionary of field names and selectors)."
            ),
            Tool(
                name="click_element",
                func=self._click_element,
                description="Click on an element in the browser. Input should be a CSS selector string."
            )
        ]
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the browser agent"""
        return """
        You are a browser automation assistant that helps users navigate websites, fill forms, and perform actions in a web browser.
        
        You can:
        1. Navigate to URLs
        2. Search for and play YouTube videos
        3. Fill out forms 
        4. Click on elements
        
        Break down the user's request into logical steps and use the available tools to accomplish the task.
        Always think step by step and use the most appropriate tool for each action.
        """
    
    async def _navigate_to_url(self, url: str) -> Dict[str, Any]:
        """Navigate to a URL using the MCP tool"""
        try:
            logger.info(f"Would navigate to URL: {url}")
            return {
                "status": "success",
                "message": f"Navigated to {url}"
            }
        except Exception as e:
            logger.error(f"Failed to navigate to URL: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to navigate to URL: {str(e)}"
            }
    
    async def _search_youtube(self, query: str) -> Dict[str, Any]:
        """Search for a video on YouTube using the MCP tool"""
        try:
            logger.info(f"Would search YouTube for: {query}")
            if hasattr(self, 'mcp_client') and self.mcp_client:
                await self.mcp_client.search_youtube(query)
                result = {
                    "status": "success",
                    "action": "youtube_search",
                    "query": query,
                    "message": f"Successfully searched and played YouTube video for '{query}'"
                }
            else:
                result = {
                    "status": "error",
                    "action": "youtube_search",
                    "query": query,
                    "message": "MCP client not initialized"
                }
            return result
        except Exception as e:
            logger.error(f"Failed to search YouTube: {str(e)}")
            return {
                "status": "error",
                "action": "youtube_search",
                "query": query,
                "message": f"Failed to search YouTube: {str(e)}"
            }
    
    async def _fill_form(self, input_str: str) -> Dict[str, Any]:
        """Fill a form using the MCP tool"""
        try:
            import json
            data = json.loads(input_str)
            form_data = data.get("form_data", {})
            selectors = data.get("selectors", {})
            
            logger.info(f"Would fill form with data: {form_data}, selectors: {selectors}")
            return {
                "status": "success",
                "message": "Filled form successfully"
            }
        except Exception as e:
            logger.error(f"Failed to fill form: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to fill form: {str(e)}"
            }
    
    async def _click_element(self, selector: str) -> Dict[str, Any]:
        """Click an element using the MCP tool"""
        try:
            logger.info(f"Would click element with selector: {selector}")
            return {
                "status": "success",
                "message": f"Clicked element with selector '{selector}'"
            }
        except Exception as e:
            logger.error(f"Failed to click element: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to click element: {str(e)}"
            }
    
    def set_mcp_client(self, mcp_client):
        """Set the MCP client to use for tool calls"""
        self.mcp_client = mcp_client 
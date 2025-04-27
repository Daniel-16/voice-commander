from typing import Dict, Any, Optional
from langchain.tools import BaseTool
from pydantic import Field, BaseModel
from .browser_controller import BrowserController

class BrowserActionInput(BaseModel):
    url: Optional[str] = None
    action: str
    selectors: Optional[Dict[str, str]] = None
    inputs: Optional[Dict[str, str]] = None

class YouTubeSearchInput(BaseModel):
    query: str

class WebNavigationInput(BaseModel):
    url: str

class BrowserTool(BaseTool):
    name: str = "browser"
    description: str = """A tool for browser automation. Use this when you need to:
    1. Navigate to websites
    2. Play videos
    3. Fill forms
    4. Click elements

    The response should be in the format:
    {
        "action_type": "browser",
        "parameters": {
            "url": "the website URL",
            "action": "navigate/play_video/fill_form/click",
            "inputs": {"field": "value"} (optional),
            "selectors": {"element": "selector"} (optional)
        }
    }

    Examples:
    1. Opening GitHub:
    {
        "action_type": "browser",
        "parameters": {
            "url": "https://github.com",
            "action": "navigate"
        }
    }

    2. Playing YouTube video:
    {
        "action_type": "browser",
        "parameters": {
            "url": "https://www.youtube.com",
            "action": "play_video",
            "inputs": {"search": "video name"}
        }
    }"""
    
    args_schema: type[BaseModel] = BrowserActionInput
    browser: BrowserController = Field(default=None)
    
    def __init__(self, **data):
        super().__init__(**data)
        self.browser = BrowserController()

    async def _arun(self, tool_input: Dict[str, Any]) -> str:
        try:
            action_input = BrowserActionInput(**tool_input)
            result = await self.browser.execute_action(action_input)
            
            return {
                "action_type": "browser",
                "parameters": tool_input,
                "status": "success" if result else "error",
                "message": "Browser action completed successfully" if result else "Failed to execute browser action"
            }
        except Exception as e:
            return {
                "action_type": "error",
                "parameters": {},
                "status": "error",
                "message": str(e)
            }

    def _run(self, tool_input: Dict[str, Any]) -> str:
        raise NotImplementedError("BrowserTool only supports async operations")

class YouTubeSearchTool(BrowserTool):
    name: str = "youtube_search"
    description: str = """A tool for searching YouTube videos. 
    Provide a search query and it will navigate to YouTube's search results page.
    
    The response will be in the format:
    {
        "action_type": "browser",
        "parameters": {
            "url": "https://www.youtube.com/results?search_query=your+search+query",
            "action": "navigate"
        }
    }
    
    Example:
    Input: {
        "query": "dog video"
    }
    """
    
    args_schema: type[BaseModel] = YouTubeSearchInput

    async def _arun(self, tool_input: Dict[str, Any]) -> str:
        try:
            search_input = YouTubeSearchInput(**tool_input)
            formatted_query = search_input.query.replace(" ", "+")
            browser_action = {
                "url": f"https://www.youtube.com/results?search_query={formatted_query}",
                "action": "navigate"
            }
            return await super()._arun(browser_action)
        except Exception as e:
            return {
                "action_type": "error",
                "parameters": {},
                "status": "error",
                "message": f"Failed to search YouTube: {str(e)}"
            }

class WebNavigationTool(BrowserTool):
    name: str = "navigate_website"
    description: str = """A tool for navigating to specific websites. 
    Provide a URL and it will open that website in the browser.
    
    Example:
    To navigate to GitHub:
    {
        "url": "https://github.com"
    }
    """
    
    args_schema: type[BaseModel] = WebNavigationInput

    async def _arun(self, tool_input: Dict[str, Any]) -> str:
        try:
            nav_input = WebNavigationInput(**tool_input)
            browser_action = {
                "url": nav_input.url,
                "action": "navigate"
            }
            return await super()._arun(browser_action)
        except Exception as e:
            return {
                "action_type": "error",
                "parameters": {},
                "status": "error",
                "message": f"Failed to navigate to website: {str(e)}"
            } 
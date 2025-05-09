import logging
from typing import Dict, Any, Optional, List
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel

from ..external_services import BrowserService, EmailService

logger = logging.getLogger("mcp_connector.server")

class NavigateParams(BaseModel):
    url: str

class YoutubeSearchParams(BaseModel):
    search_query: str

class FormParams(BaseModel):
    form_data: Dict[str, str]
    selectors: Optional[Dict[str, str]] = None

class ClickParams(BaseModel):
    selector: str

class EmailParams(BaseModel):
    recipient: str
    subject: str
    body: str
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    is_html: bool = False

class MCPConnector:
    """MCP Connector that bridges agents and external services"""
    
    def __init__(self, name: str = "Alris MCP Connector"):
        """Initialize the MCP connector with required services"""
        self.mcp = FastMCP(name)
        
        self.browser_service = BrowserService()
        self.email_service = EmailService()
        
        self._register_tools()
        
        logger.info("MCP Connector initialized")
    
    def _register_tools(self):
        """Register all tools with the MCP server"""
        
        @self.mcp.tool()
        async def navigate(params: NavigateParams) -> Dict[str, Any]:
            """Navigate to a URL in the browser"""
            success = await self.browser_service.navigate(params.url)
            if success:
                return {
                    "status": "success",
                    "message": f"Successfully navigated to {params.url}"
                }
            return {
                "status": "error",
                "message": f"Failed to navigate to {params.url}"
            }
        
        @self.mcp.tool()
        async def search_youtube(params: YoutubeSearchParams) -> Dict[str, Any]:
            """Search for a video on YouTube"""
            query = params.search_query.replace(" ", "+")
            url = f"https://www.youtube.com/results?search_query={query}"
            success = await self.browser_service.navigate(url)
            if success:
                await self.browser_service.click_element("a#video-title")
                return {
                    "status": "success",
                    "message": f"Successfully searched for and played YouTube video: {params.search_query}"
                }
            return {
                "status": "error",
                "message": f"Failed to search YouTube for {params.search_query}"
            }
        
        @self.mcp.tool()
        async def fill_form(params: FormParams) -> Dict[str, Any]:
            """Fill a form with the provided data"""
            success = await self.browser_service.fill_form(
                params.form_data, 
                params.selectors
            )
            if success:
                return {
                    "status": "success",
                    "message": "Successfully filled form"
                }
            return {
                "status": "error",
                "message": "Failed to fill form"
            }
        
        @self.mcp.tool()
        async def click_element(params: ClickParams) -> Dict[str, Any]:
            """Click on an element in the browser"""
            success = await self.browser_service.click_element(params.selector)
            if success:
                return {
                    "status": "success",
                    "message": f"Successfully clicked element: {params.selector}"
                }
            return {
                "status": "error",
                "message": f"Failed to click element: {params.selector}"
            }
        
        # Email tools
        @self.mcp.tool()
        async def send_email(params: EmailParams) -> Dict[str, Any]:
            """Send an email"""
            success = await self.email_service.send_email(
                recipient=params.recipient,
                subject=params.subject,
                body=params.body,
                cc=params.cc,
                bcc=params.bcc,
                is_html=params.is_html
            )
            if success:
                return {
                    "status": "success",
                    "message": f"Successfully sent email to {params.recipient}"
                }
            return {
                "status": "error",
                "message": f"Failed to send email to {params.recipient}"
            }
        
        logger.info("MCP tools registered")
    
    @property
    def tools(self) -> Dict[str, Any]:
        """Get all registered tools"""
        if hasattr(self.mcp, "_tool_manager"):
            return self.mcp._tool_manager._tools
        return {}
    
    def run(self):
        """Run the MCP server"""
        logger.info("Starting MCP server")
        self.mcp.run()
    
    async def shutdown(self):
        """Shutdown the MCP server and services"""
        logger.info("Shutting down MCP server")
        await self.browser_service.close()
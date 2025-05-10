import logging
from typing import Dict, Any
import re
import asyncio
from .browser_agent import BrowserAgent

logger = logging.getLogger("langchain_agent.orchestrator")

class AgentOrchestrator:
    """
    Orchestrates and coordinates different specialized agents
    to handle user commands based on their intent
    """
    
    def __init__(self):
        """Initialize the orchestrator with specialized agents"""
        self.browser_agent = BrowserAgent()
        self._cleanup_tasks = set()
        
        self._intent_patterns = {
            "browser": [
                r"browse|navigate|go to|open.*website|visit|url|web page",
                r"search.*youtube|play.*video|watch.*video",
                r"fill.*form|input.*field|enter.*data",
                r"click.*button|click.*link|press.*button",
                r"screenshot|capture.*screen"
            ],
            "email": [
                r"send.*email|compose.*email|mail to|email to"
            ],
            "calendar": [
                r"schedule|meeting|appointment|calendar|event|remind"
            ]
        }
        
        logger.info("Agent Orchestrator initialized")
    
    def set_mcp_client(self, mcp_client):
        """Set the MCP client for all agents"""
        self.browser_agent.set_mcp_client(mcp_client)
    
    def _detect_intent(self, command: str) -> str:
        """
        Detect the intent of a user command
        """
        command = command.lower()
        
        for intent_type, patterns in self._intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, command):
                    logger.info(f"Detected {intent_type} intent in command: {command}")
                    return intent_type
        
        logger.info(f"No specific intent detected in command: {command}")
        return "general"
    
    async def process_command(self, command: str, thread_id: str = None) -> Dict[str, Any]:
        """
        Process a user command
        """
        try:
            logger.info(f"Processing command: {command}")
            
            intent = self._detect_intent(command)
            
            if intent == "browser":
                result = await self.browser_agent.execute(command, thread_id=thread_id)
            else:
                logger.info(f"Using browser agent for general command: {command}")
                result = await self.browser_agent.execute(command, thread_id=thread_id)
            
            return {
                "intent": intent,
                "command": command,
                "result": result
            }
        except Exception as e:
            logger.error(f"Error processing command: {str(e)}")
            logger.exception("Full command processing error:")
            return {
                "intent": "error",
                "command": command,
                "error": str(e)
            }
    
    async def cleanup(self):
        """Cleanup any pending tasks"""
        try:
            for task in self._cleanup_tasks:
                if not task.done():
                    task.cancel()
            
            if self._cleanup_tasks:
                await asyncio.gather(*self._cleanup_tasks, return_exceptions=True)
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
        finally:
            self._cleanup_tasks.clear() 
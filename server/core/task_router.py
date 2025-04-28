from typing import Dict, Any, Optional
import logging
from .models import APITask, WebTask

logger = logging.getLogger("alris_task_router")

class TaskRouter:
    def __init__(self):
        self.api_patterns = [
            "search", "query", "fetch", "list", "get",
            "create", "update", "delete", "api",
            "add", "remove", "schedule", "send",
            "retrieve", "generate", "save", "edit",
            "upload", "download", "share", "sync",
            "read", "write", "authorize", "validate",
            "connect", "disconnect", "extract", "notify"
        ]
        self.web_patterns = [
            "open", "navigate", "click", "type", "fill",
            "play", "pause", "browse", "scroll",
            "select", "drag", "drop", "hover",
            "submit", "check", "uncheck", "load",
            "view", "zoom", "capture", "focus",
            "inspect", "highlight", "refresh", "reload",
            "login", "logout", "download", "preview",
            "interact", "watch", "bookmark", "search",
            "video", "youtube", "stream", "watch_video"
        ]
        
    def _is_api_task(self, task: Dict[str, Any]) -> bool:
        """Determine if a task should be handled via API"""
        action = task.get("action", "").lower()
        parameters = task.get("parameters", {})
        
        # Check action against API patterns
        if any(pattern in action for pattern in self.api_patterns):
            return True
            
        # Check if task involves API endpoints
        if "endpoint" in parameters or "api" in parameters:
            return True
            
        return False
        
    def _is_web_task(self, task: Dict[str, Any]) -> bool:
        """Determine if a task should be handled via web automation"""
        action = task.get("action", "").lower()
        parameters = task.get("parameters", {})
        
        # Check action against web patterns
        if any(pattern in action for pattern in self.web_patterns):
            return True
            
        # Check if task involves URLs or web elements
        if "url" in parameters or "selector" in parameters:
            return True
            
        return False
        
    async def route_task(self, task: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Route a task to the appropriate handler"""
        try:
            if self._is_api_task(task):
                return APITask(
                    endpoint=task.get("parameters", {}).get("endpoint", ""),
                    method=task.get("parameters", {}).get("method", "GET"),
                    parameters=task.get("parameters", {})
                ).model_dump()
                
            elif self._is_web_task(task):
                return WebTask(
                    action=task.get("action", ""),
                    url=task.get("parameters", {}).get("url"),
                    parameters=task.get("parameters", {})
                ).model_dump()
                
            else:
                logger.warning(f"Could not determine task type for: {task}")
                return None
                
        except Exception as e:
            logger.error(f"Error routing task: {str(e)}")
            return None 
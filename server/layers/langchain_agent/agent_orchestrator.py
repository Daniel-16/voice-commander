import logging
from typing import Dict, Any
import re
import asyncio
from .browser_agent import BrowserAgent
import random

logger = logging.getLogger("langchain_agent.orchestrator")

class AgentOrchestrator:
    def __init__(self):
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
        self.browser_agent.set_mcp_client(mcp_client)
    
    def _detect_intent(self, command: str) -> str:
        command = command.lower()
        
        for intent_type, patterns in self._intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, command):
                    logger.info(f"Detected {intent_type} intent in command: {command}")
                    return intent_type
        
        logger.info(f"No specific intent detected in command: {command}")
        return "general"
    
    async def process_command(self, command: str, thread_id: str = None) -> Dict[str, Any]:
        try:
            logger.info(f"Processing command: {command}")
            
            intent = self._detect_intent(command)
            
            youtube_url_pattern = r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?\s]{11})'
            youtube_url_match = re.search(youtube_url_pattern, command)
            
            if youtube_url_match:
                video_id = youtube_url_match.group(6)
                video_url = f"https://www.youtube.com/watch?v={video_id}"
                logger.info(f"Detected direct YouTube URL with video ID: {video_id}")
                
                # Create a more natural response for direct YouTube URLs
                responses = [
                    f"I see you've shared a YouTube video! Here it is: {video_url}",
                    f"Thanks for sharing this YouTube video. I've processed it: {video_url}",
                    f"I've extracted the YouTube video you mentioned: {video_url}",
                    f"Here's the YouTube video you shared: {video_url}"
                ]
                
                response = {
                    "intent": "youtube_direct_url",
                    "command": command,
                    "result": {
                        "status": "success",
                        "message": random.choice(responses),
                        "video_urls": [video_url]
                    },
                    "video_urls": [video_url]
                }
                
                return response
            
            is_youtube_search = any(term in command.lower() for term in [
                "youtube video", "watch video", "find video", "search video", 
                "tutorial video", "youtube tutorial", "youtube search"
            ]) or (
                "youtube" in command.lower() and any(term in command.lower() for term in [
                    "search", "find", "watch", "video", "tutorial"
                ])
            )
            
            if is_youtube_search:
                logger.info(f"Detected YouTube search in command: {command}")
                query = command.lower()
                for prefix in ["youtube", "video", "tutorial", "search", "find", "watch"]:
                    query = query.replace(prefix, "")
                query = query.strip()
                
                if len(query) < 3:
                    query = command
                
                logger.info(f"Extracted YouTube search query: {query}")
                
                result = await self.browser_agent.direct_youtube_search(query)
                
                response = {
                    "intent": "youtube_search",
                    "command": command,
                    "result": result
                }
                
                if "video_urls" in result:
                    response["video_urls"] = result["video_urls"]
                    logger.info(f"Added {len(result['video_urls'])} video URLs to response")
                
                return response
            
            if intent == "browser":
                result = await self.browser_agent.execute(command, thread_id=thread_id)
            else:
                logger.info(f"Using browser agent for general command: {command}")
                result = await self.browser_agent.execute(command, thread_id=thread_id)
            
            response = {
                "intent": intent,
                "command": command,
                "result": result
            }
            
            if isinstance(result, dict) and "video_urls" in result:
                response["video_urls"] = result["video_urls"]
                logger.info(f"Propagating {len(result['video_urls'])} video URLs to response")
            
            return response
        except Exception as e:
            logger.error(f"Error processing command: {str(e)}")
            logger.exception("Full command processing error:")
            return {
                "intent": "error",
                "command": command,
                "error": str(e)
            }
    
    async def cleanup(self):
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
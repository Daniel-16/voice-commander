import logging
from typing import Dict, Any
import re
import asyncio
import json
from .browser_agent import BrowserAgent
import random
import datetime
from dateutil import parser

# Import our alternative calendar service
from ..mcp_connector.alt_calendar_service import SimpleCalendarService

logger = logging.getLogger("langchain_agent.orchestrator")

class AgentOrchestrator:
    def __init__(self):
        self.browser_agent = BrowserAgent()
        self._cleanup_tasks = set()
        self.mcp_client = None
        
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
        self.mcp_client = mcp_client
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
    
    async def _handle_calendar_intent(self, command: str) -> Dict[str, Any]:
        """Handle calendar-related commands by parsing time information and calling calendar tools."""
        logger.info(f"Handling calendar intent for command: {command}")
        
        try:
            # Extract event details from the command
            title_match = re.search(r'(?:schedule|create|add|make)\s+(?:an?|the)?\s*(?:meeting|event|appointment|reminder)(?:\s+(?:titled|called|named|about|for))?\s*["\']?([^"\']+?)["\']?(?:\s+(?:on|at|for|by))', command, re.IGNORECASE)
            
            title = ""
            if title_match:
                title = title_match.group(1).strip()
            else:
                # Try alternative pattern for "Schedule a meeting" type commands without explicit title
                meeting_type_match = re.search(r'(?:schedule|create|add|make)\s+(?:an?|the)?\s*([a-zA-Z\s]+?)(?:\s+(?:on|at|for|by))', command, re.IGNORECASE)
                if meeting_type_match:
                    meeting_type = meeting_type_match.group(1).strip()
                    # Only use as title if it's a known meeting type word
                    if any(word in meeting_type.lower() for word in ["meeting", "appointment", "event", "call", "reminder"]):
                        title = meeting_type.capitalize()
                    else:
                        title = "Meeting"
                else:
                    title = "Meeting"
            
            # Default to today if no specific date mentioned
            today = datetime.datetime.now()
            start_time = today
            end_time = today + datetime.timedelta(hours=1)
            
            # Extract date/time information
            time_pattern = r'(?:at|by|on|for)\s+([\w\s:]+(?:am|pm|AM|PM)?)'
            time_match = re.search(time_pattern, command)
            
            if time_match:
                time_str = time_match.group(1).strip()
                try:
                    # Try to parse the time string
                    parsed_time = parser.parse(time_str, fuzzy=True)
                    
                    # Make sure the parsed time is in the future
                    if parsed_time < today:
                        # If time is earlier but hours/minutes specified, assume it's for today
                        if time_str.lower().endswith(('am', 'pm')) or ':' in time_str:
                            parsed_time = datetime.datetime.combine(today.date(), parsed_time.time())
                            
                        # If it's still in the past, assume it's for tomorrow
                        if parsed_time < today:
                            parsed_time = parsed_time + datetime.timedelta(days=1)
                    
                    start_time = parsed_time
                    end_time = start_time + datetime.timedelta(hours=1)
                except Exception as e:
                    logger.warning(f"Failed to parse time string '{time_str}': {e}")
            
            # Format times properly for the API
            start_time_str = start_time.strftime("%Y-%m-%dT%H:%M:%S")
            end_time_str = end_time.strftime("%Y-%m-%dT%H:%M:%S")
            
            # Extract description if any
            description_match = re.search(r'description\s+["\']?([^"\']+)["\']?', command, re.IGNORECASE)
            description = None
            if description_match:
                description = description_match.group(1).strip()
            
            # Call the calendar service
            if not self.mcp_client:
                logger.error("MCP client not available")
                logger.info("Falling back to alternative calendar service")
                return await self._use_alternative_calendar_service(title, start_time_str, end_time_str, description)
            
            if not self.mcp_client.connected:
                logger.error("MCP client not connected")
                # Try to reconnect once
                try:
                    logger.info("Attempting to reconnect MCP client")
                    connected = await self.mcp_client.connect()
                    if connected:
                        logger.info("MCP client reconnected successfully")
                    else:
                        logger.error("Failed to reconnect MCP client")
                        logger.info("Falling back to alternative calendar service")
                        return await self._use_alternative_calendar_service(title, start_time_str, end_time_str, description)
                except Exception as e:
                    logger.error(f"Error reconnecting MCP client: {str(e)}")
                    logger.info("Falling back to alternative calendar service")
                    return await self._use_alternative_calendar_service(title, start_time_str, end_time_str, description)
            
            logger.info(f"Scheduling event with title: {title}, start: {start_time_str}, end: {end_time_str}")
            
            # Call the calendar tool via MCP
            event_params = {
                "title": title,
                "start_time": start_time_str,
                "end_time": end_time_str
            }
            
            if description:
                event_params["description"] = description
                
            try:
                response = await self.mcp_client.call_tool("schedule_calendar_event", event_params)
                logger.info(f"Calendar service response: {response}")
                
                # Check if response is a dictionary or if it's a CallToolResult object
                if hasattr(response, "content"):
                    # It's a CallToolResult object
                    response_content = response.content
                    # If response_content is a string, try to parse it as JSON
                    if isinstance(response_content, str):
                        try:
                            response_content = json.loads(response_content)
                        except json.JSONDecodeError:
                            # Use as is if not valid JSON
                            pass
                    
                    if isinstance(response_content, dict) and response_content.get("status") == "success":
                        status = "success"
                    else:
                        status = "error"
                else:
                    # It's a dictionary (old style)
                    status = response.get("status")
                
                if status == "success":
                    return {
                        "status": "success",
                        "result": f"I've scheduled an event titled '{title}' starting at {start_time.strftime('%I:%M %p on %A, %B %d')} and ending at {end_time.strftime('%I:%M %p')}."
                    }
                else:
                    # Falling back to alternative service
                    logger.info("MCP tool call didn't return success, falling back to alternative calendar service")
                    return await self._use_alternative_calendar_service(title, start_time_str, end_time_str, description)
            except Exception as e:
                logger.error(f"Error calling MCP calendar tool: {str(e)}")
                logger.info("Falling back to alternative calendar service")
                return await self._use_alternative_calendar_service(title, start_time_str, end_time_str, description)
                
        except Exception as e:
            logger.error(f"Error in calendar intent handler: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "result": f"I had trouble scheduling your event: {str(e)}"
            }
    
    async def _use_alternative_calendar_service(self, title, start_time, end_time, description=None):
        """Use the alternative calendar service when MCP is unavailable"""
        logger.info(f"Using alternative calendar service for event: {title}")
        
        result = await SimpleCalendarService.schedule_event(
            title=title,
            start_time=start_time,
            end_time=end_time,
            description=description
        )
        
        if result.get("status") == "success":
            parsed_start = parser.parse(start_time)
            parsed_end = parser.parse(end_time)
            return {
                "status": "success",
                "result": f"I've scheduled an event titled '{title}' starting at {parsed_start.strftime('%I:%M %p on %A, %B %d')} and ending at {parsed_end.strftime('%I:%M %p')}."
            }
        else:
            return {
                "status": "error",
                "result": f"I couldn't schedule your event. {result.get('message', 'Please check your Google Apps Script configuration.')}"
            }
    
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
                
                # Remove only if they appear at the start of the query
                prefixes = ["i want to watch", "i wanna watch", "can you find", "please find", "find me", 
                          "search for", "look for", "youtube", "video", "tutorial about", "tutorial on",
                          "tutorial for", "videos about", "videos on", "videos for"]
                
                for prefix in prefixes:
                    if query.startswith(prefix):
                        query = query[len(prefix):].strip()
                
                # If query is too short after cleaning, use original command
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
            elif intent == "calendar":
                # Handle calendar intents with dedicated method
                result = await self._handle_calendar_intent(command)
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
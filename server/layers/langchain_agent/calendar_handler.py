import logging
import datetime
import json
import re
from typing import Dict, Any, Optional
from dateutil import parser

from ..mcp_connector.alt_calendar_service import SimpleCalendarService
from .title_extractor import extract_event_title_from_command

logger = logging.getLogger("langchain_agent.calendar_handler")

async def extract_date_time_from_command(command: str) -> tuple:
    """Extract date and time information from a calendar command.
    
    Args:
        command: The natural language command containing date/time information
        
    Returns:
        A tuple of (start_time, end_time) as datetime objects
    """
    today = datetime.datetime.now()
    start_time = today
    end_time = today + datetime.timedelta(hours=1)
    
    time_pattern = r'(?:at|by|on|for)\s+([\w\s:]+(?:am|pm|AM|PM)?)'
    time_match = re.search(time_pattern, command)
    
    if time_match:
        time_str = time_match.group(1).strip()
        try:
            parsed_time = parser.parse(time_str, fuzzy=True)
            
            if parsed_time < today:
                if time_str.lower().endswith(('am', 'pm')) or ':' in time_str:
                    parsed_time = datetime.datetime.combine(today.date(), parsed_time.time())
                    
                if parsed_time < today:
                    parsed_time = parsed_time + datetime.timedelta(days=1)
            
            start_time = parsed_time
            end_time = start_time + datetime.timedelta(hours=1)
        except Exception as e:
            logger.warning(f"Failed to parse time string '{time_str}': {e}")
    
    return start_time, end_time

async def use_alternative_calendar_service(title, start_time, end_time, description=None):
    """Use the alternative calendar service when MCP is unavailable.
    
    Args:
        title: The event title
        start_time: The event start time (string or datetime)
        end_time: The event end time (string or datetime)
        description: Optional description for the event
        
    Returns:
        A dictionary with the result of the operation
    """
    logger.info(f"Using alternative calendar service for event: {title}")
    
    result = await SimpleCalendarService.schedule_event(
        title=title,
        start_time=start_time,
        end_time=end_time,
        description=description
    )
    
    if result.get("status") == "success":
        parsed_start = parser.parse(start_time) if isinstance(start_time, str) else start_time
        parsed_end = parser.parse(end_time) if isinstance(end_time, str) else end_time
        return {
            "status": "success",
            "result": f"I've scheduled an event titled '{title}' starting at {parsed_start.strftime('%I:%M %p on %A, %B %d')} and ending at {parsed_end.strftime('%I:%M %p')}."
        }
    else:
        return {
            "status": "error",
            "result": f"I couldn't schedule your event. {result.get('message', 'Please check your Google Apps Script configuration.')}"
        }

async def handle_calendar_intent(command: str, mcp_client=None) -> Dict[str, Any]:
    """Handle calendar-related commands by parsing time information and calling calendar tools.
    
    Args:
        command: The natural language command containing calendar information
        mcp_client: The MCP client to use for scheduling events
        
    Returns:
        A dictionary with the result of the operation
    """
    logger.info(f"Handling calendar intent for command: {command}")
    
    try:
        # Extract title using the dedicated extractor
        title = await extract_event_title_from_command(command)
        logger.info(f"Extracted event title: '{title}' for command: '{command}'")
        
        # Extract date and time
        start_time, end_time = await extract_date_time_from_command(command)
        
        start_time_str = start_time.strftime("%Y-%m-%dT%H:%M:%S")
        end_time_str = end_time.strftime("%Y-%m-%dT%H:%M:%S")
        
        # Extract description if available
        description_match = re.search(r'description\s+["\']?([^"\']+)["\']?', command, re.IGNORECASE)
        description = None
        if description_match:
            description = description_match.group(1).strip()
        
        # If no MCP client, use alternative service
        if not mcp_client:
            logger.error("MCP client not available")
            logger.info("Falling back to alternative calendar service")
            return await use_alternative_calendar_service(title, start_time_str, end_time_str, description)
        
        # If MCP client not connected, try to reconnect
        if not mcp_client.connected:
            logger.error("MCP client not connected")
            try:
                logger.info("Attempting to reconnect MCP client")
                connected = await mcp_client.connect()
                if connected:
                    logger.info("MCP client reconnected successfully")
                else:
                    logger.error("Failed to reconnect MCP client")
                    logger.info("Falling back to alternative calendar service")
                    return await use_alternative_calendar_service(title, start_time_str, end_time_str, description)
            except Exception as e:
                logger.error(f"Error reconnecting MCP client: {str(e)}")
                logger.info("Falling back to alternative calendar service")
                return await use_alternative_calendar_service(title, start_time_str, end_time_str, description)
        
        # Schedule the event using MCP
        logger.info(f"Scheduling event with title: {title}, start: {start_time_str}, end: {end_time_str}")
        
        event_params = {
            "title": title,
            "start_time": start_time_str,
            "end_time": end_time_str
        }
        
        if description:
            event_params["description"] = description
            
        try:
            response = await mcp_client.call_tool("schedule_calendar_event", event_params)
            logger.info(f"Calendar service response: {response}")
            
            if hasattr(response, "content"):
                response_content = response.content
                if isinstance(response_content, str):
                    try:
                        response_content = json.loads(response_content)
                    except json.JSONDecodeError:
                        pass
                
                if isinstance(response_content, dict) and response_content.get("status") == "success":
                    status = "success"
                else:
                    status = "error"
            else:
                status = response.get("status")
            
            if status == "success":
                return {
                    "status": "success",
                    "result": f"I've scheduled an event titled '{title}' starting at {start_time.strftime('%I:%M %p on %A, %B %d')} and ending at {end_time.strftime('%I:%M %p')}."
                }
            else:
                logger.info("MCP tool call didn't return success, falling back to alternative calendar service")
                return await use_alternative_calendar_service(title, start_time_str, end_time_str, description)
        except Exception as e:
            logger.error(f"Error calling MCP calendar tool: {str(e)}")
            logger.info("Falling back to alternative calendar service")
            return await use_alternative_calendar_service(title, start_time_str, end_time_str, description)
                
    except Exception as e:
        logger.error(f"Error in calendar intent handler: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "result": f"I had trouble scheduling your event: {str(e)}"
        } 
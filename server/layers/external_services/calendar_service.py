import os
import json
import logging
import asyncio
import requests
from typing import Dict, Any, Optional
from pydantic import BaseModel

logger = logging.getLogger("external_services.calendar")

class CalendarEventParams(BaseModel):
    title: str
    start_time: str
    end_time: str
    description: Optional[str] = None

class CalendarService:
    @staticmethod
    async def schedule_event(params: CalendarEventParams) -> Dict[str, Any]:
        logger.info(f"Scheduling calendar event with title: {params.title}")
        apps_script_url = os.environ.get("GOOGLE_APPS_SCRIPT_CALENDAR_URL")
        
        if not apps_script_url:
            logger.error("GOOGLE_APPS_SCRIPT_CALENDAR_URL environment variable is not set.")
            return {
                "status": "error",
                "message": "Google Apps Script URL is not configured in the server."
            }
                
        if apps_script_url.endswith('%'):
            apps_script_url = apps_script_url[:-1]
            logger.info(f"Fixed Google Apps Script URL by removing trailing % character")
        
        logger.info(f"Using Google Apps Script URL: {apps_script_url}")
        
        payload = {
            "title": params.title,
            "startTime": params.start_time,
            "endTime": params.end_time,
        }
        if params.description:
            payload["description"] = params.description
        
        headers = {"Content-Type": "application/json"}
        
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: requests.post(apps_script_url, json=payload, headers=headers, timeout=30)
            )
            response.raise_for_status()
            
            response_data = response.json()
            logger.info(f"Apps Script response: {response_data}")
            
            if response_data.get("success"):
                return {
                    "status": "success",
                    "message": response_data.get("message", "Event created successfully!"),
                    "eventId": response_data.get("eventId")
                }
            else:
                return {
                    "status": "error",
                    "message": response_data.get("message", "Unknown error from Apps Script.")
                }
                
        except requests.exceptions.Timeout:
            logger.error(f"Timeout while calling Google Apps Script: {apps_script_url}")
            return {
                "status": "error",
                "message": "Request to Google Apps Script timed out."
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Google Apps Script: {e}")
            return {
                "status": "error",
                "message": f"Failed to communicate with Google Apps Script: {str(e)}"
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode JSON response from Apps Script: {e}")
            return {
                "status": "error",
                "message": "Invalid JSON response from Google Apps Script."
            }
        except Exception as e:
            logger.error(f"An unexpected error occurred in schedule_calendar_event: {e}", exc_info=True)
            return {
                "status": "error",
                "message": f"An unexpected error occurred: {str(e)}"
            } 
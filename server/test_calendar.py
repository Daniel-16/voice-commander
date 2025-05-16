#!/usr/bin/env python3
"""Test script for manually testing the calendar functionality."""

import os
import asyncio
import logging
from dotenv import load_dotenv
from layers.mcp_connector.mcp_server import MCPConnector
from layers.mcp_connector.mcp_client import AlrisMCPClient
from layers.external_services.calendar_service import CalendarEventParams

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("test_calendar")

async def test_calendar():
    # Check if the Google Apps Script URL is set
    load_dotenv()
    script_url = os.environ.get("GOOGLE_APPS_SCRIPT_CALENDAR_URL")
    if not script_url:
        logger.error("GOOGLE_APPS_SCRIPT_CALENDAR_URL is not set in .env file")
        print("Error: GOOGLE_APPS_SCRIPT_CALENDAR_URL is not set in the .env file")
        print("Please add it to your .env file like:")
        print("GOOGLE_APPS_SCRIPT_CALENDAR_URL=https://script.google.com/macros/s/your-script-id/exec")
        return
    
    print(f"Using Google Apps Script URL: {script_url}")
    
    # Start the MCP server
    print("Starting MCP server...")
    mcp_connector = MCPConnector()
    server_thread = asyncio.create_task(asyncio.to_thread(mcp_connector.run))
    await asyncio.sleep(1)  # Give the server time to start
    
    # Connect the MCP client
    print("Connecting MCP client...")
    mcp_client = AlrisMCPClient()
    connected = await mcp_client.connect()
    if not connected:
        print("Failed to connect MCP client")
        return
    
    print("MCP client connected successfully")
    
    # Test calendar functionality
    test_params = CalendarEventParams(
        title="Test Event from Alris",
        start_time="2024-12-31T12:00:00",
        end_time="2024-12-31T13:00:00",
        description="This is a test event created by the Alris calendar service"
    )
    
    print(f"Scheduling test event: {test_params.title}")
    response = await mcp_client.call_tool("schedule_calendar_event", test_params.dict())
    print(f"Calendar service response: {response}")
    
    # Cleanup
    print("Cleaning up...")
    await mcp_client.disconnect()
    
    # Cancel the server thread
    server_thread.cancel()
    try:
        await server_thread
    except asyncio.CancelledError:
        pass
    
    print("Test completed")

if __name__ == "__main__":
    try:
        asyncio.run(test_calendar())
    except KeyboardInterrupt:
        print("Test interrupted by user") 
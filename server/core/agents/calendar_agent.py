from typing import Dict, Any, List
from datetime import datetime, timedelta
from langchain.agents import Tool, AgentExecutor
from langchain.agents import create_structured_chat_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import SystemMessage
from . import BaseAgent

class CalendarAgent(BaseAgent):
    def _get_tools(self) -> list[Tool]:
        tools = [
            Tool(
                name="validate_datetime",
                func=self._validate_datetime,
                description="Validate date and time for calendar events"
            ),
            Tool(
                name="create_event",
                func=self._create_event,
                description="Create a calendar event"
            ),
            Tool(
                name="parse_datetime",
                func=self._parse_datetime,
                description="Parse date and time from natural language"
            )
        ]
        return tools

    def _create_agent(self) -> AgentExecutor:
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="You are a calendar management AI assistant that helps schedule and manage calendar events."),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            ("system", "To help you achieve tasks, you have access to the following tools:\n\n{tools}\n\nThe available tools are: {tool_names}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        agent = create_structured_chat_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        return AgentExecutor.from_agent_and_tools(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True
        )

    async def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a calendar-related task"""
        action = task.get("action")
        parameters = task.get("parameters", {})

        if action == "validate_datetime":
            return await self._validate_datetime(parameters)
        elif action == "create_event":
            return await self._create_event(parameters)
        
        return {
            "status": "error",
            "message": f"Unknown calendar action: {action}"
        }

    async def _validate_datetime(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Validate date and time parameters"""
        try:
            # Parse the datetime
            event_time = await self._parse_datetime(parameters.get("date", ""))
            
            # Validate it's not in the past
            if event_time < datetime.now():
                return {
                    "status": "error",
                    "message": "Cannot schedule events in the past"
                }
            
            # Validate it's within reasonable future (e.g., 1 year)
            if event_time > datetime.now() + timedelta(days=365):
                return {
                    "status": "error",
                    "message": "Cannot schedule events more than 1 year in advance"
                }
            
            return {
                "status": "success",
                "validated_datetime": event_time.isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"DateTime validation failed: {str(e)}"
            }

    async def _create_event(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Create a calendar event"""
        try:
            # In a real implementation, this would integrate with Google Calendar or similar
            event_time = await self._parse_datetime(parameters.get("date", ""))
            
            event = {
                "title": parameters.get("title", "Untitled Meeting"),
                "datetime": event_time.isoformat(),
                "platform": parameters.get("platform", "zoom"),
                "participants": parameters.get("participants", [])
            }
            
            # Here you would actually create the event in the calendar system
            
            return {
                "status": "success",
                "message": "Event created successfully",
                "event": event
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Event creation failed: {str(e)}"
            }

    async def _parse_datetime(self, datetime_str: str) -> datetime:
        """Parse datetime from natural language"""
        try:
            # This is a simplified implementation
            # In a real system, you'd use a more sophisticated NLP approach
            if datetime_str.lower() == "tomorrow":
                return datetime.now() + timedelta(days=1)
            elif datetime_str.lower() == "next week":
                return datetime.now() + timedelta(days=7)
            else:
                # Attempt to parse as ISO format
                return datetime.fromisoformat(datetime_str)
        except Exception as e:
            raise ValueError(f"Could not parse datetime: {str(e)}") 
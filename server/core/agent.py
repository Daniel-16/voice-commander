import os
from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.messages import HumanMessage, SystemMessage
from .browser_controller import BrowserController
from .models import ActionResponse, BrowserAction

SYSTEM_PROMPT = """You are Alris, an AI agent that helps users by converting their natural language commands into structured actions. Your role is to:
1. Understand the user's intent
2. Convert commands into appropriate actions
3. Return a JSON response that can be executed

You must return a JSON with the following structure:
{
    "action_type": "browser" | "system" | "calendar" | "email",
    "parameters": {
        // Action specific parameters
        "url": "URL to visit" (for browser actions),
        "action": "specific action to take",
        "selectors": {"key": "value"} (for browser actions),
        "inputs": {"field": "value"} (for form inputs)
    }
}

Example 1 - Playing YouTube:
Input: "Play Despacito on YouTube"
Output: {
    "action_type": "browser",
    "parameters": {
        "url": "https://www.youtube.com",
        "action": "play_video",
        "inputs": {"search": "Despacito"}
    }
}

Example 2 - Scheduling a meeting:
Input: "Schedule a meeting with John tomorrow at 2pm"
Output: {
    "action_type": "calendar",
    "parameters": {
        "action": "create_event",
        "title": "Meeting with John",
        "date": "2024-03-14",
        "time": "14:00",
        "attendees": ["John"]
    }
}

Always return valid JSON that matches this structure."""

class AlrisAgent:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-pro-exp-03-25",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.1
        )
        self.browser = BrowserController()
        self.prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content="{input}")
        ])
        self.parser = JsonOutputParser()
        self.chain = self.prompt | self.llm | self.parser

    async def process_command(self, command: str) -> Dict[str, Any]:
        try:            
            action_data = await self.chain.ainvoke({"input": command})
            
            if action_data["action_type"] == "browser":
                browser_action = BrowserAction(**action_data["parameters"])
                result = await self.browser.execute_action(browser_action)
                return ActionResponse(
                    action_type="browser",
                    parameters=action_data["parameters"],
                    status="success" if result else "error",
                    message="Action completed successfully" if result else "Failed to execute browser action"
                ).model_dump()                        
            
            return ActionResponse(
                action_type=action_data["action_type"],
                parameters=action_data["parameters"],
                status="success",
                message="Command processed successfully"
            ).model_dump()

        except Exception as e:
            return ActionResponse(
                action_type="error",
                parameters={},
                status="error",
                message=str(e)
            ).model_dump() 
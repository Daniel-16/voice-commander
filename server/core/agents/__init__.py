import os
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
from langchain.agents import Tool
from langchain.agents import AgentExecutor
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferMemory
from dotenv import load_dotenv
load_dotenv()

class BaseAgent(ABC):
    def __init__(self, model_name: Optional[str] = None):
        model = model_name or os.getenv('GEMINI_MODEL')
        if not model:
            raise ValueError("GEMINI_MODEL environment variable must be set or model_name must be provided")
            
        self.llm = ChatGoogleGenerativeAI(
            model=model,
            temperature=0,
            convert_system_message_to_human=True
        )
        self.memory = ConversationBufferMemory(memory_key="chat_history")
        self.tools = self._get_tools()
        self.agent_executor = self._create_agent()

    @abstractmethod
    def _get_tools(self) -> list[Tool]:
        """Get list of tools available to this agent"""
        pass

    @abstractmethod
    def _create_agent(self) -> AgentExecutor:
        """Create the agent executor"""
        pass

    @abstractmethod
    async def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific task"""
        pass

from .task_agent import TaskAgent
from .calendar_agent import CalendarAgent
from .browser_agent import BrowserAgent

__all__ = ['TaskAgent', 'CalendarAgent', 'BrowserAgent'] 
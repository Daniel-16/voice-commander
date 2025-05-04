import os
from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
from langchain.agents import Tool
from langchain.agents import AgentExecutor
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferMemory
from dotenv import load_dotenv
from langchain.prompts import ChatPromptTemplate
from langchain.agents import create_structured_chat_agent
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
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="output"
        )
        self.tools = self._get_tools()
        self.agent_executor = self._create_agent()

    @abstractmethod
    def _get_tools(self) -> List[Tool]:
        """Get list of tools for this agent"""
        pass

    def _create_agent(self, prompt: ChatPromptTemplate) -> AgentExecutor:
        """Create the agent executor"""
        agent = create_structured_chat_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
                
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=10
        )

    async def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task using the agent"""
        try:
            formatted_input = {
                "input": str(task),
                "chat_history": self.memory.chat_memory.messages if self.memory.chat_memory.messages else []
            }
            
            result = await self.agent_executor.ainvoke(formatted_input)
            
            self.memory.chat_memory.add_user_message(str(task))
            self.memory.chat_memory.add_ai_message(str(result.get("output", "")))
            
            return result
        except Exception as e:
            import traceback
            print(f"Task execution failed: {str(e)}\n{traceback.format_exc()}") 
            error_msg = f"Task execution failed: {str(e)}"
            self.memory.chat_memory.add_ai_message(f"Error: {error_msg}")
            return {
                "status": "error",
                "message": error_msg
            }

from .task_agent import TaskAgent
from .calendar_agent import CalendarAgent
from .browser_agent import BrowserAgent

__all__ = ['TaskAgent', 'CalendarAgent', 'BrowserAgent'] 
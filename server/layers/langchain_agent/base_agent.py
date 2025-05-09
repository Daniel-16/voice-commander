import os
import logging
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferMemory
from langchain.agents import Tool, AgentExecutor, create_structured_chat_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

logger = logging.getLogger("langchain_agent.base")

class BaseAgent(ABC):
    """Base class for all LangChain agents"""
    
    def __init__(self, model_name: Optional[str] = None):
        """Initialize the base agent with LLM and memory"""
        model = model_name or os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
        
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
        self.agent_executor = self._create_agent_executor()
        
        logger.info(f"Initialized {self.__class__.__name__}")
    
    @abstractmethod
    def _get_tools(self) -> List[Tool]:
        """Get the tools for this agent"""
        pass
    
    def _create_agent_executor(self) -> AgentExecutor:
        """Create an agent executor with the tools and memory"""
        prompt = self._get_agent_prompt()
        
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
    
    def _get_agent_prompt(self) -> ChatPromptTemplate:
        """Get the prompt for the agent"""
        return ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
    
    @abstractmethod
    def _get_system_prompt(self) -> str:
        """Get the system prompt for this agent"""
        pass
    
    async def execute(self, input_text: str) -> Dict[str, Any]:
        """Execute the agent with the given input"""
        try:
            result = await self.agent_executor.ainvoke({
                "input": input_text,
                "chat_history": self.memory.chat_memory.messages or []
            })
            
            return {
                "status": "success",
                "result": result.get("output", ""),
                "thought_process": result.get("intermediate_steps", [])
            }
        except Exception as e:
            logger.error(f"Error executing agent: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to execute agent: {str(e)}"
            } 
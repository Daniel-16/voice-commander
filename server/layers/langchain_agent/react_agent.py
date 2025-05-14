import os
import logging
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import HumanMessage
from langchain.agents import Tool

logger = logging.getLogger("langchain_agent.react")

class BaseReactAgent(ABC):
    """Base class for all LangGraph React agents"""
    
    def __init__(self, model_name: Optional[str] = None):
        """Initialize the base agent with LLM and memory"""
        model = model_name or os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
        
        self.llm = ChatGoogleGenerativeAI(
            model=model,
            temperature=0,
            convert_system_message_to_human=True
        )
        
        self.memory = MemorySaver()
        self.tools = self._get_tools()
        
        system_message = self._get_system_prompt()
        self.agent_executor = create_react_agent(
            model=self.llm,
            tools=self.tools,
            state_modifier=system_message,
            checkpointer=self.memory
        )
        
        logger.info(f"Initialized {self.__class__.__name__}")
    
    @abstractmethod
    def _get_tools(self) -> List[Tool]:
        """Get the tools for this agent"""
        pass
    
    @abstractmethod
    def _get_system_prompt(self) -> str:
        """Get the system prompt for this agent"""
        pass
    
    async def execute(self, input_text: str, thread_id: str = None) -> Dict[str, Any]:
        """Execute the agent with the given input"""
        try:
            logger.debug(f"Executing agent with input: {input_text}")
            
            config = {
                "configurable": {
                    "thread_id": thread_id or "default",
                    "checkpoint_ns": "alris",
                    "checkpoint_id": f"agent_{thread_id or 'default'}"
                }
            }
            
            messages = [HumanMessage(content=input_text)]
            result = await self.agent_executor.ainvoke({"messages": messages}, config=config)
            
            logger.debug("Agent execution completed successfully")
            
            if isinstance(result, dict):
                if "messages" in result:
                    last_message = result["messages"][-1] if result["messages"] else None
                    tool_outputs = [msg for msg in result["messages"] if hasattr(msg, 'tool_call_id')]
                    
                    response = {
                        "status": "success",
                        "result": last_message.content if last_message else "",
                        "messages": result["messages"],
                        "tool_outputs": [
                            {
                                "tool": msg.name,
                                "output": msg.content
                            } for msg in tool_outputs
                        ] if tool_outputs else []
                    }
                    return response
                else:
                    response = {
                        "status": "success",
                        "result": result.get("message", str(result)),
                        "action": result.get("action", "unknown"),
                        "messages": []
                    }
                    return response
            response = {
                "status": "success",
                "result": str(result),
                "messages": []
            }
            return response
            
        except Exception as e:
            logger.error(f"Error executing agent: {str(e)}")
            logger.exception("Full agent execution error:")
            return {
                "status": "error", 
                "error_type": type(e).__name__,
                "message": str(e),
                "details": f"Failed to execute agent: {str(e)}"
            } 
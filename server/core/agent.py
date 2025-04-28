import os
from typing import Dict, Any
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
# from langchain_core.prompts import MessagesPlaceholder
from langgraph.prebuilt.chat_agent_executor import create_react_agent
from .tools import YouTubeSearchTool, WebNavigationTool
from .models import ActionResponse, APITask, WebTask
from .task_router import TaskRouter
from .state_manager import StateManager
from config.prompt import SYSTEM_PROMPT

logger = logging.getLogger("alris_agent")

class AlrisAgent:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-pro-exp-03-25",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.1
        )
        
        # Initialize tools with categories
        self.api_tools = []
        self.web_tools = [YouTubeSearchTool(), WebNavigationTool()]
        
        # Initialize task management
        self.task_router = TaskRouter()
        self.state_manager = StateManager()
        
        # Create agent executor with all tools
        self.agent_executor = create_react_agent(
            model=self.llm,
            tools=self.api_tools + self.web_tools,
            state_modifier=SystemMessage(content=SYSTEM_PROMPT)
        )

    async def process_command(self, command: str) -> Dict[str, Any]:
        logger.info(f"Processing command: {command}")
        try:
            task_id = self.state_manager.create_task({"command": command})
            
            result = await self.agent_executor.ainvoke({
                "messages": [HumanMessage(content=command)]
            })
            
            if isinstance(result, dict) and "messages" in result:
                try:
                    last_message = next((msg for msg in reversed(result["messages"]) 
                                      if isinstance(msg, AIMessage)), None)
                    
                    if last_message and last_message.content:
                        import json
                        import re
                        
                        json_match = re.search(r'\{.*\}', last_message.content, re.DOTALL)
                        if json_match:
                            try:
                                action_data = json.loads(json_match.group())
                                logger.debug(f"Parsed action data: {action_data}")
                                
                                # Route the task
                                routed_task = await self.task_router.route_task(action_data)
                                if routed_task:
                                    self.state_manager.update_task_state(
                                        task_id,
                                        status="routed",
                                        context={"routed_task": routed_task}
                                    )
                                    
                                    if routed_task["task_type"] == "api":
                                        api_task = APITask(**routed_task)
                                        pass
                                    else:
                                        # Handle web task
                                        web_task = WebTask(**routed_task)
                                        if web_task.action == "play_video" and "youtube.com" in web_task.url:
                                            youtube_tool = YouTubeSearchTool()
                                            query = web_task.parameters.get("search")
                                            logger.info(f"Executing YouTube search: {query}")
                                            result = await youtube_tool._arun({"query": query})
                                            
                                            self.state_manager.update_task_state(
                                                task_id,
                                                status="completed",
                                                result=result
                                            )
                                            return result
                                
                                return action_data
                                
                            except json.JSONDecodeError as e:
                                logger.error(f"JSON decode error: {e}", exc_info=True)
                                self.state_manager.update_task_state(
                                    task_id,
                                    status="error",
                                    error=str(e)
                                )
                    
                    error_response = ActionResponse(
                        action_type="error",
                        parameters={},
                        status="error",
                        message="Could not extract valid JSON response from agent"
                    )
                    logger.error(error_response.message)
                    return error_response.model_dump()
                    
                except Exception as e:
                    error_response = ActionResponse(
                        action_type="error",
                        parameters={},
                        status="error",
                        message=f"Failed to process agent response: {str(e)}"
                    )
                    logger.error(f"{error_response.message}: {e}", exc_info=True)
                    return error_response.model_dump()
            
            error_response = ActionResponse(
                action_type="error",
                parameters={},
                status="error",
                message="Invalid response format from agent"
            )
            logger.error(error_response.message)
            return error_response.model_dump()
            
        except Exception as e:
            error_response = ActionResponse(
                action_type="error",
                parameters={},
                status="error",
                message=str(e)
            )
            logger.error(f"Agent processing error: {e}", exc_info=True)
            return error_response.model_dump() 
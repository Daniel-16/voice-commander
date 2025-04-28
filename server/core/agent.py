import os
from typing import Dict, Any, List
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import MessagesPlaceholder
from langgraph.prebuilt.chat_agent_executor import create_react_agent, AgentState
from .tools import YouTubeSearchTool, WebNavigationTool
from .models import ActionResponse
from config.prompt import SYSTEM_PROMPT

logger = logging.getLogger("alris_agent")

class AlrisAgent:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-pro-exp-03-25",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.1
        )
        
        self.tools = [YouTubeSearchTool(), WebNavigationTool()]
        
        self.agent_executor = create_react_agent(
            model=self.llm,
            tools=self.tools,
            state_modifier=SystemMessage(content=SYSTEM_PROMPT)
        )

    async def process_command(self, command: str) -> Dict[str, Any]:
        logger.info(f"Processing command: {command}")
        try:
            result = await self.agent_executor.ainvoke({
                "messages": [HumanMessage(content=command)]
            })
            
            logger.debug(f"Agent result: {result}")
            
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
                                
                                # Handle tool_code format and convert to browser action
                                if action_data.get("action_type") == "tool_code" and action_data.get("parameters", {}).get("tool_name") == "default_api.youtube_search":
                                    youtube_tool = YouTubeSearchTool()
                                    query = action_data["parameters"]["tool_args"]["query"]
                                    logger.info(f"Executing YouTube search: {query}")
                                    result = await youtube_tool._arun({"query": query})
                                    return result
                                
                                # Handle existing browser action format
                                if "action_type" in action_data and "parameters" in action_data:
                                    logger.info(f"Executing browser action: {action_data['action_type']}")
                                    return action_data
                                elif "parameters" in action_data:
                                    response = {
                                        "action_type": "browser",
                                        "parameters": action_data["parameters"],
                                        "status": "success",
                                        "message": "Action completed"
                                    }
                                    logger.info(f"Converted to browser action: {response}")
                                    return response
                            except json.JSONDecodeError as e:
                                logger.error(f"JSON decode error: {e}", exc_info=True)
                    
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
from typing import Dict, Any, List
from langchain.agents import Tool, AgentExecutor
from langchain.agents import create_structured_chat_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import SystemMessage
from . import BaseAgent
from core.browser_controller import BrowserController

class BrowserAgent(BaseAgent):
    def __init__(self):
        self.browser_controller = BrowserController()
        super().__init__()

    def _get_tools(self) -> list[Tool]:
        tools = [
            Tool(
                name="navigate",
                func=self._navigate,
                description="Navigate to a specified URL"
            ),
            Tool(
                name="click",
                func=self._click,
                description="Click an element on the page"
            ),
            Tool(
                name="play_video",
                func=self._play_video,
                description="Play a video on platforms like YouTube"
            )
        ]
        return tools

    def _create_agent(self) -> AgentExecutor:
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="You are a browser automation AI assistant that helps navigate web pages and interact with web content."),
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
            verbose=True,
            return_intermediate_steps=True,
            handle_parsing_errors=True,
            agent_kwargs={
                "memory_prompts": [MessagesPlaceholder(variable_name="chat_history")],
                "input_variables": ["input", "agent_scratchpad", "chat_history", "tools", "tool_names"]
            }
        )

    async def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a browser-related task"""
        try:
            result = await self.agent_executor.ainvoke(
                {
                    "input": str(task),
                    "chat_history": self.memory.chat_memory.messages if self.memory.chat_memory.messages else [],
                    "agent_scratchpad": [],  # Initialize as empty list for messages
                    "tools": self.tools,  # Add tools
                    "tool_names": [tool.name for tool in self.tools]  # Add tool names
                }
            )
            
            action = task.get("action")
            parameters = task.get("parameters", {})

            if action == "navigate":
                return await self._navigate(parameters.get("url", ""))
            elif action == "interact":
                if "video" in parameters:
                    return await self._play_video(parameters.get("video", ""))
                elif "click" in parameters:
                    return await self._click(parameters.get("selector", ""))
            
            return {
                "status": "error",
                "message": f"Unknown browser action: {action}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Task execution failed: {str(e)}"
            }

    async def _navigate(self, url: str) -> Dict[str, Any]:
        """Navigate to a URL"""
        try:
            await self.browser_controller.navigate(url)
            return {
                "status": "success",
                "message": f"Successfully navigated to {url}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Navigation failed: {str(e)}"
            }

    async def _click(self, selector: str) -> Dict[str, Any]:
        """Click an element on the page"""
        try:
            await self.browser_controller.click_element(selector)
            return {
                "status": "success",
                "message": f"Successfully clicked element {selector}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Click failed: {str(e)}"
            }

    async def _play_video(self, search_query: str) -> Dict[str, Any]:
        """Play a video on YouTube"""
        try:
            # Navigate to YouTube
            await self.browser_controller.navigate("https://www.youtube.com")
            
            # Search for the video
            search_box = "input#search"
            await self.browser_controller.fill_form({"search": search_query})
            await self.browser_controller.click_element("button#search-icon-legacy")
            
            # Click the first video
            await self.browser_controller.click_element("a#video-title")
            
            return {
                "status": "success",
                "message": f"Successfully playing video: {search_query}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Video playback failed: {str(e)}"
            } 
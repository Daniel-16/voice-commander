from typing import Dict, Any, List
from langchain.agents import Tool, AgentExecutor
from langchain.agents import create_structured_chat_agent
from langchain.tools import BaseTool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import SystemMessage
from . import BaseAgent

class TaskAgent(BaseAgent):
    def _get_tools(self) -> list[Tool]:
        tools = [
            Tool(
                name="intent_analyzer",
                func=self._analyze_intent_internal,
                description="Analyzes the intent of a user command"
            ),
            Tool(
                name="task_decomposer",
                func=self._decompose_task_internal,
                description="Breaks down a task into smaller subtasks"
            )
        ]
        return tools

    def _create_agent(self) -> AgentExecutor:
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="You are a task management AI assistant that helps analyze and decompose tasks."),
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
        """Execute a task-related operation"""
        action = task.get("action")
        parameters = task.get("parameters", {})

        if action == "analyze_intent":
            return await self.analyze_intent(parameters.get("command", ""))
        elif action == "decompose":
            return await self.decompose_task(parameters)
        elif action == "aggregate":
            return await self.aggregate_results(parameters.get("results", []))
        
        return {
            "status": "error",
            "message": f"Unknown task action: {action}"
        }

    async def analyze_intent(self, command: str) -> Dict[str, Any]:
        """Analyze the intent of a user command"""
        result = await self.agent_executor.arun(
            f"Analyze the intent of this command: {command}"
        )
        
        # Parse the result into a structured format
        intent_type = self._determine_intent_type(command, result)
        parameters = self._extract_parameters(command, result)
        
        return {
            "intent_type": intent_type,
            "parameters": parameters,
            "original_command": command
        }

    async def decompose_task(self, task_intent: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Decompose a task into subtasks based on intent"""
        result = await self.agent_executor.arun(
            f"Decompose this task into subtasks: {task_intent}"
        )
        
        # Convert the agent's response into structured subtasks
        return self._parse_subtasks(result, task_intent)

    async def aggregate_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate results from multiple subtasks"""
        return {
            "status": "success",
            "results": results,
            "summary": await self._generate_summary(results)
        }

    def _analyze_intent_internal(self, command: str) -> Dict[str, Any]:
        """Internal method for intent analysis"""
        if "schedule" in command.lower() or "meeting" in command.lower():
            return {"intent_type": "calendar"}
        elif "play" in command.lower() or "video" in command.lower():
            return {"intent_type": "browser"}
        else:
            return {"intent_type": "unknown"}

    def _decompose_task_internal(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Internal method for task decomposition"""
        intent_type = task.get("intent_type")
        
        if intent_type == "calendar":
            return self._decompose_calendar_task(task)
        elif intent_type == "browser":
            return self._decompose_browser_task(task)
        else:
            return [task]  # Return as single task if no decomposition needed

    def _determine_intent_type(self, command: str, analysis_result: str) -> str:
        """Determine the type of intent from analysis result"""
        if "schedule" in command.lower() or "meeting" in command.lower():
            return "calendar"
        elif "play" in command.lower() or "video" in command.lower():
            return "browser"
        return "unknown"

    def _extract_parameters(self, command: str, analysis_result: str) -> Dict[str, Any]:
        """Extract parameters from the command and analysis"""
        # This would use NLP to extract relevant parameters
        # For now, using a simple implementation
        params = {}
        
        if "tomorrow" in command.lower():
            params["date"] = "tomorrow"
        if "zoom" in command.lower():
            params["platform"] = "zoom"
        
        return params

    def _parse_subtasks(self, decomposition_result: str, task_intent: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse the decomposition result into structured subtasks"""
        intent_type = task_intent.get("intent_type")
        
        if intent_type == "calendar":
            return self._decompose_calendar_task(task_intent)
        elif intent_type == "browser":
            return self._decompose_browser_task(task_intent)
        
        return [task_intent]  # Return original task if no decomposition needed

    def _decompose_calendar_task(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Decompose a calendar-related task"""
        return [
            {
                "intent_type": "calendar",
                "action": "validate_datetime",
                "parameters": task.get("parameters", {})
            },
            {
                "intent_type": "calendar",
                "action": "create_event",
                "parameters": task.get("parameters", {})
            }
        ]

    def _decompose_browser_task(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Decompose a browser-related task"""
        return [
            {
                "intent_type": "browser",
                "action": "navigate",
                "parameters": task.get("parameters", {})
            },
            {
                "intent_type": "browser",
                "action": "interact",
                "parameters": task.get("parameters", {})
            }
        ]

    async def _generate_summary(self, results: List[Dict[str, Any]]) -> str:
        """Generate a summary of the results"""
        summary_prompt = f"Summarize these task results: {results}"
        return await self.agent_executor.arun(summary_prompt) 
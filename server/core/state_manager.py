from typing import Dict, Any, Optional
import logging
import uuid
from .models import TaskState

logger = logging.getLogger("alris_state_manager")

class StateManager:
    def __init__(self):
        self.states: Dict[str, TaskState] = {}
        
    def create_task(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Create a new task and return its ID"""
        task_id = str(uuid.uuid4())
        self.states[task_id] = TaskState(
            task_id=task_id,
            status="created",
            context=context or {}
        )
        return task_id
        
    def update_task_state(self, task_id: str, 
                         status: Optional[str] = None,
                         result: Optional[Dict[str, Any]] = None,
                         error: Optional[str] = None,
                         context: Optional[Dict[str, Any]] = None) -> None:
        """Update the state of a task"""
        if task_id not in self.states:
            logger.warning(f"Attempted to update non-existent task: {task_id}")
            return
            
        task_state = self.states[task_id]
        
        if status:
            task_state.status = status
        if result:
            task_state.result = result
        if error:
            task_state.error = error
        if context:
            task_state.context = {**(task_state.context or {}), **context}
            
    def get_task_state(self, task_id: str) -> Optional[TaskState]:
        """Get the current state of a task"""
        return self.states.get(task_id)
        
    def cleanup_task(self, task_id: str) -> None:
        """Remove a task's state"""
        if task_id in self.states:
            del self.states[task_id] 
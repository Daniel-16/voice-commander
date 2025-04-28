from pydantic import BaseModel
from typing import Dict, Any, Optional

class UserCommand(BaseModel):
    command: str

class ActionResponse(BaseModel):
    action_type: str
    parameters: Dict[str, Any]
    status: str
    message: Optional[str] = None

class BrowserAction(BaseModel):
    url: Optional[str] = None
    action: str
    selectors: Optional[Dict[str, str]] = None
    inputs: Optional[Dict[str, str]] = None

class TaskState(BaseModel):
    task_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class APITask(BaseModel):
    task_type: str = "api"
    endpoint: str
    method: str
    parameters: Optional[Dict[str, Any]] = None

class WebTask(BaseModel):
    task_type: str = "web"
    action: str
    url: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None 
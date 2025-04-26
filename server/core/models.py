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
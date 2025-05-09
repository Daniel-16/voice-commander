"""
External Services Layer

This layer contains implementations of services that interact with external systems
such as browsers, email servers, and other APIs.
"""

from .browser_service import BrowserService
from .email_service import EmailService

__all__ = ["BrowserService", "EmailService"]

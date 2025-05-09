"""
MCP Connector Layer

This layer acts as a bridge between the LangChain Agent layer and the External Services layer,
providing standardized access to tools via the Model Context Protocol (MCP).
"""

from .mcp_server import MCPConnector
from .mcp_client import AlrisMCPClient

__all__ = ["MCPConnector", "AlrisMCPClient"]

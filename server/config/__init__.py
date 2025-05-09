"""Configuration module for Alris server"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Server configuration
SERVER_HOST = os.getenv("ALRIS_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("ALRIS_PORT", "8000"))
DEBUG = os.getenv("ALRIS_DEBUG", "False").lower() == "true"
RELOAD = os.getenv("ALRIS_RELOAD", "False").lower() == "true"

# MCP configuration
MCP_HOST = os.getenv("MCP_HOST", "localhost")
MCP_PORT = int(os.getenv("MCP_PORT", "8080"))

# LLM configuration
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-pro")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "alris_server.log") 
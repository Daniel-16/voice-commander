"""Configuration module for Alris server"""

import os
from dotenv import load_dotenv
load_dotenv()

SERVER_HOST = os.getenv("HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("ALRIS_DEBUG", "False").lower() == "true"
RELOAD = os.getenv("ALRIS_RELOAD", "False").lower() == "true"

MCP_HOST = os.getenv("MCP_HOST", "localhost")
MCP_PORT = int(os.getenv("MCP_PORT", "8080"))

GEMINI_MODEL = os.getenv("GEMINI_MODEL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "alris_server.log") 
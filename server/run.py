import os
import logging
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("alris_server.log")
    ]
)
logger = logging.getLogger("alris_run")

if __name__ == "__main__":
    # Get server configuration from environment variables or use defaults
    host = os.getenv("ALRIS_HOST", "0.0.0.0")
    port = int(os.getenv("ALRIS_PORT", "8000"))
    
    logger.info(f"Starting Alris server on {host}:{port}")
    logger.info("Using layered architecture with LangChain Agent, MCP Connector, and External Services layers")
    
    # Run the FastAPI application using Uvicorn
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ALRIS_RELOAD", "False").lower() == "true"
    )
import os
import logging
import uvicorn
from dotenv import load_dotenv

load_dotenv()

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
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    logger.info(f"Starting Alris server on {host}:{port}")
    logger.info("Using layered architecture with LangChain Agent, MCP Connector, and External Services layers")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ALRIS_RELOAD", "False").lower() == "true"
    )

import asyncio
import logging
from layers.mcp_connector import MCPConnector

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("alris_mcp_server.log")
    ]
)
logger = logging.getLogger("mcp_server")

if __name__ == "__main__":
    logger.info("Starting standalone MCP server")
    mcp_connector = MCPConnector()
    mcp_connector.run()

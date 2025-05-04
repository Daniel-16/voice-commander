import logging
from dotenv import load_dotenv
from alris_mcp.server import AlrisMCPServer

load_dotenv()

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("alris_mcp_run.log")
    ]
)
logger = logging.getLogger("alris_mcp_run")

def main():
    logger.info("Starting Alris MCP server")
    try:
        server = AlrisMCPServer()
        logger.debug("AlrisMCPServer instance created")
        server.run()
    except Exception as e:
        logger.error(f"Failed to start server: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    main()
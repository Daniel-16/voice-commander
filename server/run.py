import logging
from alris_mcp.server import AlrisMCPServer

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
    server = AlrisMCPServer()
    logger.debug("AlrisMCPServer instance created")
    server.run()

if __name__ == "__main__":
    main()
import asyncio
import websockets
import json
import pytest
from alris_mcp.server import AlrisMCPServer
import threading
import time

def start_server():
    server = AlrisMCPServer()
    server.run()

@pytest.mark.asyncio
async def test_mcp_server():
    # Start server in a separate thread
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()
    
    # Give the server a moment to start
    time.sleep(1)
    
    try:
        async with websockets.connect("ws://localhost:8000/mcp") as websocket:
            # Test capability listing
            await websocket.send(json.dumps({
                "id": 1,
                "method": "list_capabilities",
                "params": {}
            }))
            response = json.loads(await websocket.recv())
            assert "result" in response
            assert isinstance(response["result"], list)
            
            # Test browser navigation
            await websocket.send(json.dumps({
                "id": 2,
                "method": "browser.navigate",
                "params": {
                    "url": "https://www.example.com"
                }
            }))
            response = json.loads(await websocket.recv())
            assert "result" in response
    except Exception as e:
        pytest.fail(f"Test failed: {str(e)}")

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 
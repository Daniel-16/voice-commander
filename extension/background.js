const WS_URL = "ws://localhost:8080/extension";
let socket = null;
let reconnectInterval = 5000;

function connect() {
  console.log("Attempting to connect to WebSocket server...", WS_URL);
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("Connected to WebSocket server");
    updatePopupStatus("Connected");
  };

  socket.onmessage = async (event) => {
    console.log("Message received from server:", event.data);
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse message", error);
      return;
    }

    if (data.type === "command" && data.payload) {
      await executeCommand(data.payload);
    }
  };

  socket.onclose = (event) => {
    console.log("Websocket disconnected. Reason: ", event.code, event.reason);
    updatePopupStatus(`Disconnected (Code: ${event.code})`);
    socket = null;
    setTimeout(connect, reconnectInterval);
  };

  socket.onerror = (error) => {
    console.error("Websocket error: ", error);
    updatePopupStatus(error);
    socket = null;
  };
}

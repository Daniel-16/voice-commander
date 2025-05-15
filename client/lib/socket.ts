// @ts-nocheck
const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? `wss://alris-bmkl.onrender.com/ws`
    : `ws://localhost:8000/ws`;

let socket: WebSocket | null = null;

const getSocket = () => {
  if (!socket) {
    socket = new WebSocket(SOCKET_URL);

    socket.onopen = () => {
      console.log("WebSocket Connected");
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected");
      socket = null;
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };
  }
  return socket;
};

export default getSocket;

export const disconnectSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const sendMessage = (message: string) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        command: message,
      })
    );
  } else {
    console.error("WebSocket is not connected");
  }
};

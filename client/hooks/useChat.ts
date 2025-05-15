// @ts-nocheck
import { useEffect, useCallback, useState } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";

interface ChatMessage {
  type: "command" | "response";
  content: string;
  timestamp: number;
}

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("chat_response", (response) => {
      setMessages((prev) => [
        ...prev,
        {
          type: "response",
          content: response,
          timestamp: Date.now(),
        },
      ]);
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const sendCommand = useCallback(
    (command) => {
      if (socket && isConnected) {
        socket.emit("chat_command", command);
        setMessages((prev) => [
          ...prev,
          {
            type: "command",
            content: command,
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [socket, isConnected]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendCommand,
    clearMessages,
    isConnected,
  };
};

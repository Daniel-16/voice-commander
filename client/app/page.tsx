"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = "ws://localhost:8080";

export default function HomePage() {
  const [status, setStatus] = useState<string>("Initializing...");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [messages, setMessages] = useState<
    Array<{ type: string; content: string; timestamp: string }>
  >([]); // Added messages state
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Added ref for auto-scroll
  const MAX_RECONNECT_DELAY = 30000;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: string, content: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages((prev) => [...prev, { type, content, timestamp }]);
  };

  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.CONNECTING) {
      console.log("Already attempting to connect...");
      return;
    }

    console.log("Attempting to connect WebSocket...");
    setStatus("Connecting...");

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.onclose = null;
      if (socketRef.current.readyState !== WebSocket.CLOSED) {
        socketRef.current.close();
      }
    }

    try {
      socketRef.current = new WebSocket(WS_URL);

      socketRef.current.onopen = () => {
        console.log("WebSocket connected");
        setStatus("Ready");
        addMessage("system", "Connected to server");
        reconnectAttempts.current = 0;
      };

      socketRef.current.onmessage = (event) => {
        console.log("Message from server:", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === "status") {
            setStatus(data.payload || "Unknown status");
            addMessage("system", data.payload);
            // Reset status to Ready after a delay if it's a non-error status
            if (!data.payload.toLowerCase().includes("error")) {
              setTimeout(() => setStatus("Ready"), 3000);
            }
          } else if (data.type === "error") {
            setStatus(`Error: ${data.payload}`);
            addMessage("error", data.payload);
            // Reset status to Ready after showing error
            setTimeout(() => setStatus("Ready"), 3000);
          } else if (data.type === "message") {
            if (data.payload === "Processing") {
              setStatus("Processing...");
            } else {
              addMessage("response", data.payload);
              // If it's a completion message, reset status
              if (
                data.payload === "Execution confirmed" ||
                data.payload === "Ready"
              ) {
                setStatus("Ready");
              }
            }
          }
        } catch (error) {
          console.error("Failed to parse message:", error);
          setStatus("Error processing server message");
          addMessage("error", "Failed to process server message");
          // Reset status to Ready after error
          setTimeout(() => setStatus("Ready"), 3000);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("Connection Error");
        addMessage("error", "Connection error occurred");
      };

      socketRef.current.onclose = (event) => {
        console.log(
          "WebSocket closed. Code:",
          event.code,
          "Reason:",
          event.reason || "No reason provided"
        );
        setStatus("Disconnected - Retrying...");
        addMessage("system", "Disconnected from server");

        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          MAX_RECONNECT_DELAY
        );
        reconnectAttempts.current++;

        console.log(`Attempting to reconnect in ${delay}ms...`);
        reconnectTimerRef.current = setTimeout(connectWebSocket, delay);
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      setStatus("Failed to create WebSocket connection");
      addMessage("error", "Failed to create connection");
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      console.log("Cleaning up WebSocket connection");
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const sendCommandText = () => {
    if (!inputText.trim()) {
      setStatus("Please enter a command.");
      addMessage("error", "Please enter a command");
      setTimeout(() => setStatus("Ready"), 1500);
      return;
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log(`Sending command: "${inputText}"`);
      const message = JSON.stringify({
        type: "voice_command",
        payload: inputText,
      });
      socketRef.current.send(message);
      setStatus("Processing...");
      addMessage("command", inputText);
      setInputText("");

      // Set a timeout to reset UI state if no response is received
      const timeoutId = setTimeout(() => {
        setStatus("No response from server");
        addMessage("error", "Command timed out - no response received");
        setTimeout(() => setStatus("Ready"), 1500);
      }, 10000); // 10 second timeout

      // Clear the timeout when component unmounts or when a new command is sent
      return () => clearTimeout(timeoutId);
    } else {
      setStatus("Not connected. Cannot send.");
      addMessage("error", "Not connected to server");
      setTimeout(() => {
        if (
          !socketRef.current ||
          socketRef.current.readyState !== WebSocket.OPEN
        ) {
          connectWebSocket();
        } else {
          setStatus("Ready");
        }
      }, 1000);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      sendCommandText();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-2xl flex flex-col gap-6 bg-white p-6 md:p-8 rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Voice Commander
          </h1>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                status === "Ready"
                  ? "bg-green-500"
                  : status.includes("Error")
                  ? "bg-red-500"
                  : status === "Connecting..."
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <span className="text-sm font-medium text-gray-600">{status}</span>
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 ${
                msg.type === "command" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.type === "command"
                    ? "bg-blue-500 text-white"
                    : msg.type === "response"
                    ? "bg-white border border-gray-200 text-gray-700"
                    : msg.type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-800 text-sm"
                }`}
              >
                <p>{msg.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Type a command (e.g., open google.com)"
              className="flex-1 p-3 text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={
                status !== "Ready" &&
                status !== "Unsupported command" &&
                !status.startsWith("Error:") &&
                status !== "Executed" &&
                status !== "Disconnected. Retrying..."
              }
            />
            <button
              onClick={sendCommandText}
              disabled={
                status !== "Ready" &&
                status !== "Unsupported command" &&
                !status.startsWith("Error:") &&
                status !== "Executed" &&
                status !== "Disconnected. Retrying..."
              }
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Type a command and press Enter or click Send
          </p>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const WS_URL = "ws://localhost:8080";

export default function HomePage() {
  const [status, setStatus] = useState("Initializing...");
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<
    Array<{ type: string; content: string; timestamp: string }>
  >([]);
  const [extensionStatus, setExtensionStatus] = useState<string>("Unknown");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognition = useRef<SpeechRecognition | null>(null);
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        speechRecognition.current = new SpeechRecognition();
        speechRecognition.current.continuous = false;
        speechRecognition.current.interimResults = false;
        speechRecognition.current.lang = "en-US";

        speechRecognition.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(
              JSON.stringify({
                type: "voice_command",
                payload: transcript,
              })
            );
            setStatus("Processing voice command...");
            addMessage("command", transcript);
          }
        };

        speechRecognition.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setStatus("Error: " + event.error);
          addMessage("error", "Speech recognition error: " + event.error);
          setIsRecording(false);
          setTimeout(() => setStatus("Ready"), 3000);
        };

        speechRecognition.current.onend = () => {
          setIsRecording(false);
        };
      } else {
        setStatus("Error: Speech recognition not supported");
        addMessage("error", "Speech recognition not supported in this browser");
      }
    }
  }, []);

  const startRecording = async () => {
    try {
      if (speechRecognition.current) {
        await speechRecognition.current.start();
        setIsRecording(true);
        setStatus("Recording...");
        addMessage("system", "Started recording");
      } else {
        throw new Error("Speech recognition not initialized");
      }
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setStatus("Error: Could not start speech recognition");
      addMessage("error", "Could not start speech recognition");
      setIsRecording(false);
      setTimeout(() => setStatus("Ready"), 3000);
    }
  };

  const stopRecording = () => {
    if (speechRecognition.current) {
      speechRecognition.current.stop();
      setIsRecording(false);
    }
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
        setStatus("Initializing...");
        addMessage("system", "Web interface connected");
        reconnectAttempts.current = 0;
      };

      socketRef.current.onmessage = (event) => {
        console.log("Message from server:", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === "status") {
            setStatus(data.payload || "Unknown status");
            addMessage("system", data.payload);
            if (!data.payload.toLowerCase().includes("error")) {
              setTimeout(() => setStatus("Ready"), 3000);
            }
          } else if (data.type === "error") {
            setStatus(`Error: ${data.payload}`);
            addMessage("error", data.payload);
            setTimeout(() => setStatus("Ready"), 3000);
          } else if (data.type === "message") {
            if (data.payload === "Processing") {
              setStatus("Processing...");
            } else if (data.payload === "Browser extension is active") {
              setExtensionStatus("Connected");
              addMessage("system", "Browser extension detected and active");
            } else if (data.payload.includes("No browser extension")) {
              setExtensionStatus("Not Connected");
              addMessage("system", data.payload);
            } else {
              addMessage("response", data.payload);
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

      let timeoutId = setTimeout(() => {
        if (status === "Processing...") {
          setStatus("Still processing...");
          timeoutId = setTimeout(() => {
            if (status.includes("processing")) {
              setStatus("No response from server");
              addMessage("error", "Command timed out - no response received");
              setTimeout(() => setStatus("Ready"), 1500);
            }
          }, 10000);
        }
      }, 10000);

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-2xl flex flex-col gap-6 bg-white p-6 md:p-8 rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Alris
          </h1>
          <div className="flex items-center gap-4">
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
              <span className="text-sm font-medium text-gray-600">
                {status}
              </span>
            </div>
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
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4"
        >
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
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={
                status !== "Ready" &&
                !isRecording &&
                status !== "Recording..." &&
                status !== "Unsupported command" &&
                !status.startsWith("Error:") &&
                status !== "Executed"
              }
              className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              }`}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    isRecording
                      ? "M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
                      : "M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  }
                />
              </svg>
            </button>
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
            {isRecording
              ? "Recording... Click the microphone button to stop"
              : "Type a command and press Enter, or click the microphone to record"}
          </p>
        </form>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../components/Navbar";
import DeviceRestriction from "../components/DeviceRestriction";
import { isDesktop } from "../utils/deviceDetection";
import { WS_URL } from "../utils/constants";

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

const MAX_RECONNECT_DELAY = 30000;

export default function HomePage() {
  const [status, setStatus] = useState("Initializing...");
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<
    Array<{ type: string; content: string; timestamp: string }>
  >([]);
  const [extensionStatus, setExtensionStatus] = useState<string>("Unknown");
  const [isDesktopDevice, setIsDesktopDevice] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognition = useRef<SpeechRecognition | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsDesktopDevice(isDesktop());
  }, []);

  const addMessage = (type: string, content: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages((prev) => [...prev, { type, content, timestamp }]);
  };

  if (!isDesktopDevice) {
    return <DeviceRestriction />;
  }

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
    if (!WS_URL) {
      console.error("WebSocket URL is not available");
      setStatus("Configuration Error");
      addMessage("error", "WebSocket configuration error");
      return;
    }

    if (socketRef.current?.readyState === WebSocket.CONNECTING) {
      console.log("Already attempting to connect...");
      return;
    }

    console.log("Attempting to connect WebSocket to:", WS_URL);
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
        console.log("WebSocket connected successfully");
        setStatus("Connected");
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
        const errorMessage =
          "Unable to connect to server. Please ensure the server is running.";
        setStatus("Connection Error");
        addMessage("error", errorMessage);

        // Add more detailed error information for debugging
        if (process.env.NODE_ENV === "development") {
          console.debug("WebSocket Debug Info:", {
            url: WS_URL,
            readyState: socketRef.current?.readyState,
            error,
          });
        }
      };

      socketRef.current.onclose = (event) => {
        console.log(
          "WebSocket closed. Code:",
          event.code,
          "Reason:",
          event.reason || "No reason provided"
        );

        let message = "Disconnected from server";
        if (event.code === 1006) {
          message += " - Unable to establish connection";
        }

        setStatus("Disconnected - Retrying...");
        addMessage("system", message);

        if (reconnectAttempts.current < 5) {
          // Limit retry attempts
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            MAX_RECONNECT_DELAY
          );
          reconnectAttempts.current++;

          console.log(
            `Attempting to reconnect in ${delay}ms... (Attempt ${reconnectAttempts.current}/5)`
          );
          reconnectTimerRef.current = setTimeout(connectWebSocket, delay);
        } else {
          setStatus("Connection Failed");
          addMessage(
            "error",
            "Maximum reconnection attempts reached. Please refresh the page to try again."
          );
        }
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

  // Add new function to get status details
  const getStatusDetails = (status: string) => {
    if (status === "Ready") {
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ),
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      };
    } else if (status.includes("Error")) {
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ),
        color: "bg-red-500",
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      };
    } else if (status === "Connecting...") {
      return {
        icon: (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ),
        color: "bg-amber-500",
        textColor: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      };
    } else {
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        color: "bg-gray-400",
        textColor: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      };
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center bg-white pt-20">
        {/* Status Toast */}
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div
            className={`transform transition-all duration-300 ${
              status === "Ready"
                ? "opacity-0 translate-y-[-100%]"
                : "opacity-100 translate-y-0"
            }`}
          >
            {status !== "Ready" && (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  getStatusDetails(status).bgColor
                } ${
                  getStatusDetails(status).borderColor
                } shadow-lg max-w-sm mx-auto`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 ${
                    getStatusDetails(status).color
                  } ${
                    getStatusDetails(status).textColor
                  } rounded-full flex items-center justify-center`}
                >
                  {getStatusDetails(status).icon}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      getStatusDetails(status).textColor
                    }`}
                  >
                    {status}
                  </p>
                  <p className="text-xs opacity-75">
                    {status === "Connecting..."
                      ? "Attempting to establish connection..."
                      : status.includes("Error")
                      ? "Please check your connection and try again"
                      : status === "Disconnected. Retrying..."
                      ? "Attempting to reconnect..."
                      : ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-3xl flex flex-col px-4 md:px-0">
          {/* Status Bar - Now more subtle */}
          <div className="flex items-center justify-end py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 opacity-75 hover:opacity-100 transition-opacity">
              <div
                className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                  getStatusDetails(status).color
                }`}
              />
              <span className="text-sm text-gray-600 font-medium">
                {status === "Ready" ? "Connected" : status}
              </span>
            </div>
          </div>

          {/* Message History */}
          <div className="flex-1 min-h-[calc(100vh-280px)] py-6 space-y-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 ${
                  msg.type === "command" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.type === "command"
                      ? "bg-blue-600 text-white"
                      : msg.type === "response"
                      ? "bg-gray-100 text-gray-900"
                      : msg.type === "error"
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : "bg-gray-50 text-gray-600 text-sm"
                  }`}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                  <span className="text-[11px] opacity-70 mt-1 block">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 py-4">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Type a command (e.g., open google.com)"
                    className="w-full pl-4 pr-12 py-3 text-gray-900 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-gray-100 border border-gray-200 transition-all duration-200"
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
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      isRecording
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] animate-gradient"
                    } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-100`}
                    title={isRecording ? "Stop Recording" : "Start Recording"}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-5 h-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 3C10.3431 3 9 4.34315 9 6V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V6C15 4.34315 13.6569 3 12 3Z"
                        fill="currentColor"
                      />
                      <path
                        d="M7 11C7 10.4477 6.55228 10 6 10C5.44772 10 5 10.4477 5 11C5 14.866 8.13401 18 12 18C15.866 18 19 14.866 19 11C19 10.4477 18.5523 10 18 10C17.4477 10 17 10.4477 17 11C17 13.7614 14.7614 16 12 16C9.23858 16 7 13.7614 7 11Z"
                        fill="currentColor"
                      />
                      <path
                        d="M13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19V21C11 21.5523 11.4477 22 12 22C12.5523 22 13 21.5523 13 21V19Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={sendCommandText}
                  disabled={
                    !inputText.trim() ||
                    (status !== "Ready" &&
                      status !== "Unsupported command" &&
                      !status.startsWith("Error:") &&
                      status !== "Executed" &&
                      status !== "Disconnected. Retrying...")
                  }
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] animate-gradient text-white rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-100 shadow-sm hover:shadow-md"
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
        </div>
      </main>
    </>
  );
}

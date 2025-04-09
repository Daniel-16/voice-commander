"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = "ws://localhost:8080";

export default function HomePage() {
  const [status, setStatus] = useState<string>("Initializing...");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const MAX_RECONNECT_DELAY = 30000; // Maximum delay of 30 seconds

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
        reconnectAttempts.current = 0; // Reset reconnection attempts on successful connection
      };

      socketRef.current.onmessage = (event) => {
        console.log("Message from server:", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === "status") {
            setStatus(data.payload || "Unknown status");
          } else if (data.type === "error") {
            setStatus(`Error: ${data.payload}`);
            setTimeout(() => setStatus("Ready"), 3000);
          }
        } catch (error) {
          console.error("Failed to parse message:", error);
          setStatus("Error processing server message");
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("Connection Error");
      };

      socketRef.current.onclose = (event) => {
        console.log(
          "WebSocket closed. Code:",
          event.code,
          "Reason:",
          event.reason || "No reason provided"
        );
        setStatus("Disconnected - Retrying...");

        // Implement exponential backoff with maximum delay
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
      setStatus("Sending...");
      setInputText("");
    } else {
      setStatus("Not connected. Cannot send.");
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

  // const startRecording = async () => {
  //   console.log('Start recording (Not implemented)');
  //   // 1. Get user media (mic access)
  //   // 2. Create MediaRecorder instance with WebM/Opus codec if possible
  //   // 3. Set up event listeners (ondataavailable)
  //   // 4. Send chunks via WebSocket or use a dedicated STT service client-side
  //   setIsRecording(true);
  //   setStatus('Listening...');
  // };

  // const stopRecording = () => {
  //   console.log('Stop recording (Not implemented)');
  //   // 1. Stop MediaRecorder
  //   // 2. Potentially send final chunk / signal end of stream
  //   setIsRecording(false);
  //   setStatus('Processing...'); // Assuming sending to backend for STT/LLM
  // };

  // const toggleRecording = () => {
  //   if (isRecording) {
  //     stopRecording();
  //   } else {
  //     startRecording();
  //   }
  // };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="z-10 w-full max-w-md items-center justify-between font-mono text-sm lg:flex flex-col bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Voice Commander
        </h1>

        <div className="w-full mb-4 p-3 bg-gray-200 rounded text-center font-semibold text-gray-700">
          Status:{" "}
          <span id="status-bar" className="ml-2">
            {status}
          </span>
        </div>

        {/* SIMULATED INPUT - Replace with Mic Button for real audio */}
        <div className="w-full flex flex-col items-center space-y-4">
          <p className="text-sm text-gray-600">
            Enter command below (simulates voice):
          </p>
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="e.g., open google.com"
            className="w-full text-gray-800 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              status !== "Ready" &&
              status !== "Unsupported command" &&
              !status.startsWith("Error:") &&
              status !== "Executed" &&
              status !== "Disconnected. Retrying..."
            }
          >
            Send Command
          </button>
        </div>

        {/* Real Mic Button (Hidden for now) */}
        {/*
        <button
          id="mic-button"
          onClick={toggleRecording}
          className={`mt-8 w-20 h-20 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400'
              : 'bg-green-500 hover:bg-green-600 focus:ring-green-400'
          }`}
          disabled={!status.startsWith('Ready') && !isRecording} // Disable if not Ready unless already recording
        >
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20"> // Mic Icon
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7v1h6v-1h-2v-2.07z" clipRule="evenodd" />
          </svg>
        </button>
         */}
      </div>
    </main>
  );
}

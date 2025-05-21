"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundBeams } from "../components/BackgroundBeams";
import { FaPaperPlane, FaMicrophone } from "react-icons/fa";
import { IoInformationCircle } from "react-icons/io5";
import NotLaunched from "../components/NotLaunched";
import ChatNavbar from "../components/ChatNavbar";
import ChatSidebar from "../components/ChatSidebar";
import { useAuth } from "../utils/AuthContext";
import getSocket, { sendMessage, disconnectSocket } from "@/lib/socket";
import VideoGrid from "@/components/VideoGrid";
import { getMessageLimits, updateMessageLimits } from "../actions/cookies";
import ProcessingMessage from "@/components/ProcessingMessage";
import { VoiceCommandInterface } from "@/components/VoiceCommandInterface";

interface Message {
  type: "user" | "assistant";
  content: string;
  timestamp: string;
  video_urls?: string[];
}

export default function ChatPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [showLimitTooltip, setShowLimitTooltip] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingMessages, setRemainingMessages] = useState(3);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { user } = useAuth();
  const [isVideoCommand, setIsVideoCommand] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const [isReconnecting, setIsReconnecting] = useState(false);
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  useEffect(() => {
    const initializeMessageLimits = async () => {
      try {
        const { lastResetTime, remainingMessages: storedMessages } =
          await getMessageLimits();

        if (lastResetTime) {
          const timeDiff = Date.now() - parseInt(lastResetTime);
          if (timeDiff >= 24 * 60 * 60 * 1000) {
            setRemainingMessages(3);
            await updateMessageLimits(3);
          } else if (storedMessages) {
            setRemainingMessages(parseInt(storedMessages));
          }
        } else {
          await updateMessageLimits(3);
        }
      } catch (err) {
        console.error("Error initializing message limits:", err);
      }
    };

    initializeMessageLimits();
  }, []);

  const attachSocketHandlers = (socket: WebSocket) => {
    socket.onopen = () => {
      setIsConnected(true);
      setError(null);
      setReconnectAttempts(0);
    };
    socket.onclose = () => {
      setIsConnected(false);
      setError(
        "Connection lost. Please check your internet connection and try again or refresh the page."
      );
    };
    socket.onerror = () => {
      setError("Unable to connect to the server. Please try again later.");
    };
    socket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        if (response.type === "response") {
          const mainMessage = response.data.split("\n")[0];
          const newMessage: Message = {
            type: "assistant",
            content: mainMessage,
            timestamp: new Date().toISOString(),
            video_urls: response.video_urls,
          };
          setMessages((prev) => [...prev, newMessage]);
          setIsProcessing(false);
          setError(null);
        } else if (response.type === "error") {
          console.error("Server error:", response.message);
          setError(
            response.message ||
              "An error occurred while processing your request."
          );
          setIsProcessing(false);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
        setError("Something went wrong. Please try again.");
        setIsProcessing(false);
      }
    };
  };

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    attachSocketHandlers(socket);
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (
          (!socketRef.current ||
            socketRef.current.readyState === WebSocket.CLOSED) &&
          reconnectAttempts < MAX_RECONNECT_ATTEMPTS
        ) {
          const newSocket = getSocket();
          socketRef.current = newSocket;
          attachSocketHandlers(newSocket);
          setReconnectAttempts((prev) => prev + 1);
        } else if (
          (!socketRef.current ||
            socketRef.current.readyState === WebSocket.CLOSED) &&
          reconnectAttempts >= MAX_RECONNECT_ATTEMPTS
        ) {
          setError(
            `Unable to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts. Please refresh the page.`
          );
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [reconnectAttempts]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const errorAlert = error && (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="h-5 w-5 text-red-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    </motion.div>
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputText.trim()) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (isReconnecting && pendingMessage) {
      if (retryIntervalRef.current) return;
      retryIntervalRef.current = setInterval(async () => {
        disconnectSocket();
        const newSocket = getSocket();
        socketRef.current = newSocket;
        attachSocketHandlers(newSocket);
        let didReconnect = false;
        await new Promise<void>((resolve) => {
          newSocket.onopen = () => {
            setIsConnected(true);
            setError(null);
            setReconnectAttempts(0);
            setIsReconnecting(false);
            didReconnect = true;
            resolve();
          };
          newSocket.onerror = () => {
            resolve();
          };
          setTimeout(() => {
            resolve();
          }, 2000);
        });
        if (
          didReconnect &&
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          const videoRegex = /(youtube\.com|youtu\.be|play (a )?video|video)/i;
          setIsVideoCommand(videoRegex.test(pendingMessage));
          const newMessage: Message = {
            type: "user",
            content: pendingMessage,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, newMessage]);
          setIsProcessing(true);
          setError(null);
          setIsReconnecting(false);
          setPendingMessage(null);
          const newValue = remainingMessages - 1;
          setRemainingMessages(newValue);
          try {
            await updateMessageLimits(newValue);
            if (socketRef.current) {
              socketRef.current.send(
                JSON.stringify({
                  command: pendingMessage,
                })
              );
            }
            setInputText("");
            setTimeout(scrollToBottom, 100);
          } catch (err) {
            setError("Failed to send message. Please try again.");
            setIsProcessing(false);
          }
          clearInterval(retryIntervalRef.current!);
          retryIntervalRef.current = null;
        }
      }, 3000);
    } else if (!isReconnecting && retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }
    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
    };
  }, [isReconnecting, pendingMessage, remainingMessages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setIsReconnecting(true);
      setPendingMessage(inputText);
      setError("Not connected to server. Please wait or refresh the page.");
      return;
    }
    if (remainingMessages <= 0) {
      setError(
        "Message limit reached. Please wait 24 hours for your limit to reset."
      );
      return;
    }

    const videoRegex = /(youtube\.com|youtu\.be|play (a )?video|video)/i;
    setIsVideoCommand(videoRegex.test(inputText));

    const newMessage: Message = {
      type: "user",
      content: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsProcessing(true);
    setError(null);
    setIsReconnecting(false);
    setPendingMessage(null);

    const newValue = remainingMessages - 1;
    setRemainingMessages(newValue);

    try {
      await updateMessageLimits(newValue);
      if (socketRef.current) {
        socketRef.current.send(
          JSON.stringify({
            command: inputText,
          })
        );
      }
      setInputText("");
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setError("Failed to send message. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleVoiceCommand = async (command: string) => {
    if (!command.trim()) return;
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setIsReconnecting(true);
      setPendingMessage(command);
      setError("Not connected to server. Please wait or refresh the page.");
      return;
    }
    if (remainingMessages <= 0) {
      setError(
        "Message limit reached. Please wait 24 hours for your limit to reset."
      );
      return;
    }

    const videoRegex = /(youtube\.com|youtu\.be|play (a )?video|video)/i;
    setIsVideoCommand(videoRegex.test(command));

    const newMessage: Message = {
      type: "user",
      content: command,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsProcessing(true);
    setError(null);
    setIsReconnecting(false);
    setPendingMessage(null);

    const newValue = remainingMessages - 1;
    setRemainingMessages(newValue);

    try {
      await updateMessageLimits(newValue);
      if (socketRef.current) {
        socketRef.current.send(
          JSON.stringify({
            command: command,
          })
        );
      }
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setError("Failed to send message. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      <ChatNavbar />
      <ChatSidebar isMobile={isMobile} />
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute inset-0 md:pl-64 flex flex-col mx-auto transition-all duration-300">
        <div className="absolute inset-0 md:pl-64 transition-all duration-300">
          <div className="absolute inset-0 opacity-30">
            <div className="fixed top-0 -left-20 w-96 h-96 bg-purple-900/30 rounded-full mix-blend-screen filter blur-[64px] animate-blob animation-delay-2000"></div>
            <div className="fixed bottom-0 -right-0 w-96 h-96 bg-blue-900/30 rounded-full mix-blend-screen filter blur-[64px] animate-blob"></div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-900/30 rounded-full mix-blend-screen filter blur-[64px] animate-blob animation-delay-4000"></div>
          </div>
        </div>

        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-screen"
            >
              <h1 className="text-xl font-bold md:text-4xl md:font-medium mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Hello {user?.user_metadata?.full_name}
              </h1>
              <h1 className="text-xl font-bold md:text-4xl md:font-medium mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                What can I do for you today?
              </h1>
              <div className="w-full max-w-[600px] px-4">
                {errorAlert}
                {isReconnecting && (
                  <div className="text-center text-yellow-400 mb-2">
                    Reconnecting...
                  </div>
                )}
                <div className="space-y-4">
                  <VoiceCommandInterface
                    onCommand={handleVoiceCommand}
                    isProcessing={isProcessing}
                    error={error}
                  />
                  <form
                    className="relative"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                  >
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Give Alris a task"
                      className="w-full px-12 py-4 bg-[#1C1C27] text-white placeholder-gray-500 text-[15px] rounded-4xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPaperPlane className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-4 mt-16 custom-scrollbar"
                style={{
                  overflowY: "auto",
                  overscrollBehaviorY: "contain",
                  height: "calc(100vh - 180px)",
                }}
              >
                {errorAlert}
                {isReconnecting && (
                  <div className="text-center text-yellow-400 mb-2">
                    Reconnecting...
                  </div>
                )}
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex flex-col ${
                      message.type === "user" ? "items-end" : "items-start"
                    } mb-4 w-full`}
                  >
                    <div
                      className={`max-w-[95%] md:max-w-[80%] rounded-lg px-3 py-2 md:px-4 md:py-4 ${
                        message.type === "user" ? "bg-blue-500" : "bg-[#1C1C27]"
                      }`}
                    >
                      <p className="text-md md:text-sm text-white break-words">
                        {message.content}
                      </p>
                    </div>
                    {message.type === "assistant" && message.video_urls && (
                      <VideoGrid videoUrls={message.video_urls} />
                    )}
                  </motion.div>
                ))}
                {isProcessing && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start mb-4 w-full"
                    >
                      <div className="max-w-[95%] md:max-w-[80%] rounded-lg px-3 py-2 md:px-4 md:py-4 bg-[#1C1C27]">
                        {isVideoCommand ? (
                          <VideoGrid isLoading={true} />
                        ) : (
                          <ProcessingMessage />
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </div>

              <div className="sticky-bottom mb-4 w-full max-w-4xl px-4 mx-auto">
                {errorAlert}
                {isReconnecting && (
                  <div className="text-center text-yellow-400 mb-2">
                    Reconnecting...
                  </div>
                )}
                <div className="space-y-4">
                  <VoiceCommandInterface
                    onCommand={handleVoiceCommand}
                    isProcessing={isProcessing}
                    error={error}
                  />
                  <form
                    className="relative"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                  >
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center">
                      <div
                        className="relative"
                        onMouseEnter={() => setShowLimitTooltip(true)}
                        onMouseLeave={() => setShowLimitTooltip(false)}
                      >
                        <div className="flex items-center gap-1 text-gray-400">
                          <IoInformationCircle className="w-4 h-4" />
                          <span className="text-sm">{remainingMessages}</span>
                        </div>
                        <AnimatePresence>
                          {showLimitTooltip && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute right-0 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap"
                            >
                              {remainingMessages} message
                              {remainingMessages !== 1 ? "s" : ""} remaining today
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Give Alris a task"
                      className="w-full py-3 px-12 md:py-4 bg-[#1C1C27] text-white placeholder-gray-500 text-[15px] rounded-4xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPaperPlane className="w-4 h-4" />
                    </button>
                  </form>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Alris can make mistakes. Check for verification of content.
                </p>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
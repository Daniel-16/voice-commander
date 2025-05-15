"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundBeams } from "../components/BackgroundBeams";
import { FaPaperPlane, FaMicrophone } from "react-icons/fa";
import NotLaunched from "../components/NotLaunched";
import ChatNavbar from "../components/ChatNavbar";
import ChatSidebar from "../components/ChatSidebar";
import { useAuth } from "../utils/AuthContext";
// import { HiLink } from "react-icons/hi";

interface Message {
  type: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const isProd = process.env.NEXT_PUBLIC_ENV === "production";
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isProd) {
    return (
      <>
        <ChatNavbar />
        <NotLaunched />
      </>
    );
  }

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      type: "user",
      content: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    setTimeout(() => {
      const aiResponse: Message = {
        type: "assistant",
        content:
          "This is a demo response. The actual AI integration will be implemented later.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      <ChatNavbar />
      <ChatSidebar isMobile={isMobile} />
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      {/* <BackgroundBeams className="opacity-20" /> */}
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
                <div className="relative">
                  <button
                    onClick={() => setShowTooltip(true)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors text-gray-400 opacity-50 cursor-not-allowed"
                  >
                    <FaMicrophone className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {showTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap"
                      >
                        Voice command is not activated as of now
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Play a youtube video"
                    className="w-full px-12 py-4 bg-[#1C1C27] text-white placeholder-gray-500 text-[15px] rounded-4xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPaperPlane className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent px-4 mt-16">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    } mb-4`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.type === "user" ? "bg-blue-500" : "bg-[#1C1C27]"
                      }`}
                    >
                      <p className="text-sm text-white">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="sticky-bottom mb-4 w-full max-w-4xl px-4 mx-auto">
                <div className="relative">
                  <button
                    onClick={() => setShowTooltip(true)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors text-gray-400 opacity-50 cursor-not-allowed"
                  >
                    <FaMicrophone className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {showTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap"
                      >
                        Voice command is not activated as of now
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Play a youtube video"
                    className="w-full px-12 py-4 bg-[#1C1C27] text-white placeholder-gray-500 text-[15px] rounded-4xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPaperPlane className="w-4 h-4" />
                  </button>
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

"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { BackgroundBeams } from "../components/BackgroundBeams";
import { FaPaperPlane, FaMicrophone } from "react-icons/fa";
import NotLaunched from "../components/NotLaunched";
import ChatNavbar from "../components/ChatNavbar";
// import { HiLink } from "react-icons/hi";

interface Message {
  type: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const isProd = process.env.NEXT_PUBLIC_ENV === "production";

  if (isProd) {
    return (
      <>
      <ChatNavbar />
      <NotLaunched />
      </>
  );
  }

  const [messages, setMessages] = useState<Message[]>([
    {
      type: "assistant",
      content: "Hi! I'm Alris, your AI assistant. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      type: "user",
      content: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Simulate AI response
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
      <BackgroundBeams className="opacity-20" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute inset-0 flex flex-col max-w-6xl mx-auto px-4 py-8">
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-50">
            <div className="fixed top-0 -left-32 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob animation-delay-2000"></div>
            <div className="fixed bottom-0 -right-32 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob"></div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob animation-delay-4000"></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent pr-4 mt-12">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600"
                    : "bg-[#1C1C27] border border-gray-800"
                }`}
              >
                <p className="text-sm sm:text-base">{message.content}</p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 px-4">
          <div className="max-w-[900px] mx-auto relative">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`absolute left-4 bottom-0 -translate-y-1/4 p-2 rounded-full transition-colors ring-1 ${
                isRecording
                  ? "text-purple-500 bg-purple-500/10 ring-purple-500"
                  : "text-gray-400 hover:text-gray-300 ring-gray-400 hover:ring-gray-300"
              }`}
            >
              <FaMicrophone className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message Alris"
              className="w-full h-24 pl-6 pb-10 pr-14 bg-[#2A2A31] text-white placeholder-gray-500 text-[15px] rounded-3xl border-0 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="absolute right-4 bottom-0 -translate-y-1/4 p-2 rounded-full transition-colors ring-1 text-gray-400 hover:text-gray-300 ring-gray-400 hover:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <FaPaperPlane className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

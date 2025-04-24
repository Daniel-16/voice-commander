"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { FaSpotify, FaCalendar, FaPlay } from "react-icons/fa";

const Hero = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const handlePlay = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    video.play().catch((error) => {
      console.log("Video play failed:", error);
    });
  };

  const commandExamples = [
    {
      icon: <FaCalendar className="w-6 h-6 text-purple-400" />,
      text: "Schedule a meeting with John",
      description: "Seamlessly manage your calendar",
    },
    {
      icon: <FaPlay className="w-6 h-6 text-blue-400" />,
      text: "Play me a dog video",
      description: "Quick access to web content",
    },
    {
      icon: <FaSpotify className="w-6 h-6 text-green-400" />,
      text: "Play Kendrick Lamar on Spotify",
      description: "Control Spotify playback with voice or text",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0A0A0F]">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-16 relative z-10">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl"
          >
            <span className="block text-gradient bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Your AI Browser Assistant
            </span>
            
            <span className="block text-gradient bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient animation-delay-2000">
              Just Got Smarter
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
          >
            Experience the future of web browsing with Alris. No extensions
            needed - just pure AI power in your browser. Control your apps,
            schedule meetings, and find content with natural language.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="rounded-md">
                <a href="/chat" className="relative group inline-block">
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative block px-8 py-3 md:py-2 md:font-bold md:px-10 rounded-xl border-2 border-transparent bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-[length:200%_auto] animate-gradient">
                    <span className="text-white font-medium">Try Alris</span>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </span>
                </a>
              </div>
              <a href="#learn-more" className="px-6 py-2 rounded-lg border border-gray-700 bg-[#12121A] text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-all duration-300">
                Learn more →
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {commandExamples.map((example, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.2 }}
              className="bg-[#12121A] p-6 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-colors duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">{example.icon}</div>
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {example.text}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {example.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-16 relative"
        >
          <div className="relative mx-auto max-w-4xl rounded-xl shadow-2xl overflow-hidden border border-purple-500/20">
            <div className="relative aspect-video bg-[#12121A] rounded-xl">
              <video
                className="w-full h-full object-cover rounded-xl"
                autoPlay
                loop
                muted
                playsInline
                poster="/video/demo-poster.jpg"
                preload="metadata"
                onLoadedData={() => setIsVideoLoaded(true)}
                onPlay={handlePlay}
              >
                <source
                  src="/video/alris-demo-2-mobile.mp4"
                  type="video/mp4"
                  media="(max-width: 768px)"
                />
                <source src="/video/alris-demo-2.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent opacity-50"></div>
            </div>
          </div>

          <div className="absolute -z-10">
            <div className="absolute right-0 w-[300px] h-[300px] bg-purple-900/30 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute left-20 w-[300px] h-[300px] bg-blue-900/30 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-0 w-[300px] h-[300px] bg-purple-900/30 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;

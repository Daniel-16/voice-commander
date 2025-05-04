"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { FaRobot, FaCode, FaTerminal, FaPlay } from "react-icons/fa";

const Hero = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const features = [
    {
      icon: <FaRobot className="w-6 h-6 text-purple-400" />,
      title: "Natural Language Control",
      description:
        "Interact with web services using simple voice or text commands",
    },
    {
      icon: <FaTerminal className="w-6 h-6 text-blue-400" />,
      title: "Browser Automation",
      description: "Automate web tasks and workflows seamlessly",
    },
    {
      icon: <FaCode className="w-6 h-6 text-green-400" />,
      title: "AI-Powered Execution",
      description: "Smart task interpretation and reliable execution",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob"></div>
        <div className="absolute left-20 w-[500px] h-[500px] bg-blue-900/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <span className="text-purple-400 font-medium tracking-wide uppercase text-sm">
              Stop wrestling with complex tools
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
          >
            <div className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-[length:200%_auto] animate-gradient mt-2">
            <span className="block">Your AI Assistant That</span>
            <span>
              Actually Gets Web Tasks Done
            </span>
            </div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-8 text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Alris turns your voice or text commands into automated web actions.
            No more context switching, no more manual browsing - just tell Alris
            what you need done online.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="/chat"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all w-full sm:w-auto"
            >
              Start Automating Now →
            </a>
            <a
              href="#learn-more"
              className="px-8 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all w-full sm:w-auto"
            >
              Learn More
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.2 }}
              className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-purple-500/40 transition-all"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-white/10 rounded-lg">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-24 relative"
        >
          <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden border border-white/10">
            <div className="relative aspect-video bg-[#12121A] rounded-2xl group">
              {!isPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                  onClick={handlePlay}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: "url('/video/alris.jpeg')",
                      filter: "brightness(0.8)",
                    }}
                  />
                  <div className="relative z-20 w-24 h-24 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                      <FaPlay className="w-8 h-8 text-[#ffffff] ml-1" />
                    </div>
                  </div>
                </div>
              )}
              {isPlaying && (
                <iframe
                  className="w-full h-full rounded-2xl"
                  src="https://www.youtube.com/embed/xZNHoTB_f6g?autoplay=1"
                  title="Alris AI Agent"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;

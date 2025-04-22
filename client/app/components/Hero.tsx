"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const Hero = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [shouldShowPlayButton, setShouldShowPlayButton] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setShouldShowPlayButton(isIOS);
  }, []);

  const handlePlay = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    video.play().catch((error) => {
      console.log("Video play failed:", error);
      setShouldShowPlayButton(true);
    });
  };

  const handleManualPlay = () => {
    const video = document.querySelector("video");
    if (video) {
      video.play().catch(console.error);
      setShouldShowPlayButton(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-16">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl"
          >
            <span className="block text-gradient bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Control Your Browser with
            </span>
            <span className="block text-gradient bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient animation-delay-2000">
              Voice and Text Commands
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
          >
            Experience the future of browser control with Alris. Use natural
            language commands to navigate, search, and automate your browsing
            experience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8"
          >
            <div className="rounded-md">
              <a href="/chat" className="relative group inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative block px-8 py-3 md:py-4 md:text-lg md:px-10 rounded-lg border-2 border-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] animate-gradient">
                  <span className="text-white font-medium">Try Alris Now</span>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </span>
              </a>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-3">
              <a href="#how-to-use" className="relative group inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative block px-8 py-3 md:py-4 md:text-lg md:px-10 rounded-lg border-2 border-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] animate-gradient">
                  <span className="text-white font-medium">Learn More</span>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </span>
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 relative"
        >
          <div className="relative mx-auto max-w-4xl rounded-lg shadow-lg overflow-hidden">
            <div className="relative aspect-video bg-gray-900 rounded-lg">
              <video
                className="w-full h-full object-cover rounded-lg"
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

              {shouldShowPlayButton && (
                <button
                  onClick={handleManualPlay}
                  className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/50 hover:bg-black/40 transition-colors"
                >
                  <svg
                    className="w-20 h-20 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}

              <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
            </div>
          </div>

          <div className="absolute -z-10">
            <div className="absolute right-0 w-[200px] h-[200px] bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute left-20 w-[200px] h-[200px] bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-0 w-[200px] h-[200px] bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;

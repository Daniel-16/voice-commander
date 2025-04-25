import { motion } from "framer-motion";
import { BackgroundBeams } from "./BackgroundBeams";

export default function NotLaunched() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <BackgroundBeams className="opacity-20" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-50">
            <div className="fixed top-0 -left-32 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob animation-delay-2000"></div>
            <div className="fixed bottom-0 -right-32 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob"></div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob animation-delay-4000"></div>
          </div>
        </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-[#12121A] rounded-2xl p-8 border border-purple-500/20"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Coming Soon!</h2>
          <p className="text-gray-400">
            Oops! 🫢 Just kidding! We're not quite ready for launch yet, but since you've signed up, 
            we'll make sure you're among the first beta users to experience the magic! 😁
          </p>
          <div className="w-full h-2 bg-purple-500/10 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-purple-500 rounded-full"></div>
          </div>
          <p className="text-sm text-purple-400">Development in progress</p>
        </div>
      </motion.div>
    </div>
  );
}

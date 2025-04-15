import { motion } from "framer-motion";
import Link from "next/link";

const DeviceRestriction = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Desktop Only Access
          </h1>
          <p className="text-gray-600">
            We apologize, but Alris is currently only available on desktop
            devices for optimal performance and functionality.
          </p>
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">
            Please access Alris from a desktop computer or laptop for the best
            experience.
          </p>
        </div>

        <Link
          href="/"
          className="relative block px-8 py-3 md:py-4 md:text-lg md:px-10 rounded-lg border-2 border-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] animate-gradient"
        >
          Return to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default DeviceRestriction;

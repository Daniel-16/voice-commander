"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const steps = [
  {
    title: "Open Alris",
    description:
      "Visit app.alris.ai in your browser. No installation or extension needed - it works instantly.",
    code: "# Just visit\napp.alris.ai",
  },
  {
    title: "Grant Permissions",
    description:
      "Allow necessary permissions for Alris to help with your tasks (microphone for voice commands, calendar for scheduling, etc).",
    code: "# One-time setup\nPermissions requested:\n- Microphone (optional)\n- Calendar\n- Notifications",
  },
  {
    title: "Start Using",
    description:
      "Type or speak your commands naturally. Alris understands and executes them instantly.",
    code: '# Example commands:\n"Schedule meeting with John"\n"Play dog videos"\n"Open Spotify and play Kendrick"',
  },
];

const HowToUse = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section id="how-to-use" className="py-20 bg-[#0A0A0F] relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold sm:text-4xl bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Start Using Alris in Seconds
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400">
            No installation needed. Just open and start commanding.
          </p>
        </motion.div>

        <div className="mt-16 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className={`cursor-pointer transition-all duration-200 ${
                    activeStep === index
                      ? "bg-purple-900/20 border-purple-500"
                      : "hover:bg-[#12121A] border-purple-500/20"
                  } p-6 rounded-lg border`}
                  onClick={() => setActiveStep(index)}
                >
                  <div className="flex items-center">
                    <div
                      className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                        activeStep === index
                          ? "bg-gradient-to-r from-purple-600 to-blue-500"
                          : "bg-gray-700"
                      } text-white font-semibold`}
                    >
                      {index + 1}
                    </div>
                    <h3 className="ml-4 text-lg font-medium text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 ml-12 text-gray-400">{step.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 lg:mt-0"
          >
            <div className="relative">
              <div className="relative rounded-lg bg-[#12121A] border border-purple-500/20 p-6 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-8 bg-[#1A1A24] flex items-center px-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <pre className="mt-6 text-sm text-gray-300 font-mono">
                  <code>{steps[activeStep].code}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowToUse;

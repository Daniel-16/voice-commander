"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaRobot, FaMicrophone, FaPlay } from "react-icons/fa";

const steps = [
  {
    icon: <FaRobot className="w-6 h-6" />,
    title: "Launch Alris",
    description:
      "Start your journey with Alris in your browser. No downloads, no waiting - just instant AI assistance.",
    code: "# Access Alris\nVisit: alris-ai.vercel.app\nStatus: Ready to assist",
  },
  {
    icon: <FaMicrophone className="w-6 h-6" />,
    title: "Give Commands",
    description:
      "Speak naturally or type your requests. Alris understands context and executes with precision.",
    code: '# Example Commands\n"Open Gmail and compose"\n"Search for recent docs"\n"Schedule team meeting"',
  },
  {
    icon: <FaPlay className="w-6 h-6" />,
    title: "Watch It Work",
    description:
      "Sit back as Alris handles your tasks. Complex workflows simplified into single commands.",
    code: "# Task Execution\nAnalyzing request...\nNavigating to service...\nTask completed ✓",
  },
];

const HowToUse = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <section
      id="how-to-use"
      className="py-24 bg-[#0A0A0F] relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 w-[600px] h-[600px] bg-purple-900/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-blob"></div>
        <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-blue-900/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-[length:200%_auto] animate-gradient">
              Three Steps to Automation
            </span>
          </h2>
          <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the future of automation with Alris's intuitive
            interface
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className={`transform transition-all duration-300 cursor-pointer group ${
                  activeStep === index ? "scale-105" : "hover:scale-102"
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div
                  className={`relative rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                    activeStep === index
                      ? "bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/50"
                      : "bg-white/5 border-white/10 hover:border-purple-500/30"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 p-3 rounded-xl ${
                          activeStep === index
                            ? "bg-gradient-to-r from-purple-600 to-blue-600"
                            : "bg-white/10"
                        }`}
                      >
                        {step.icon}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-400">
                          Step {index + 1}
                        </p>
                        <h3 className="text-xl font-semibold text-white mt-1">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    <p className="mt-4 text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={itemVariants}
            className="relative lg:h-[400px] rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/20 rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-12 bg-[#12121A]/80 backdrop-blur-sm flex items-center px-4 border-b border-purple-500/20">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="ml-4 text-sm text-gray-400">Alris Terminal</div>
              </div>
              <div className="p-6 pt-16">
                <motion.pre
                  key={activeStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-mono"
                >
                  <code className="text-purple-400">
                    {steps[activeStep].code}
                  </code>
                </motion.pre>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowToUse;

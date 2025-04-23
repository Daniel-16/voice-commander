"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const commands = [
  {
    command: "Schedule a meeting with John",
    description: "Alris will help you set up a meeting with your contacts",
    icon: "📅",
  },
  {
    command: "Play me a dog video",
    description: "Instantly find and play videos that match your interests",
    icon: "🎦",
  },
  {
    command: "Play Kendrick Lamar on Spotify",
    description: "Control your favorite music streaming services",
    icon: "🎵",
  },
];

const CommandCard = ({
  command,
  index,
}: {
  command: (typeof commands)[0];
  index: number;
}) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="flex items-center space-x-4 p-6 bg-[#12121A] rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group cursor-pointer relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-110"></div>
      <div className="text-4xl relative z-10">{command.icon}</div>
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors duration-300">
          "{command.command}"
        </h3>
        <p className="text-gray-400">{command.description}</p>
      </div>
    </motion.div>
  );
};

const ExampleCommands = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section className="py-20 bg-[#0A0A0F] relative">
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
            Just Ask and It's Done
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400">
            Here are some examples of what you can do with Alris
          </p>
        </motion.div>

        <div className="mt-16 max-w-3xl mx-auto space-y-6">
          {commands.map((command, index) => (
            <CommandCard
              key={command.command}
              command={command}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExampleCommands;

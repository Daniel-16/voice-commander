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
    icon: "🐕",
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
      className="flex items-center space-x-4 p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer"
    >
      <div className="text-4xl">{command.icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
          "{command.command}"
        </h3>
        <p className="text-gray-600">{command.description}</p>
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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold sm:text-4xl bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
            Just Ask and It's Done
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
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

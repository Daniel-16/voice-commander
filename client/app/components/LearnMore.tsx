"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const topics = [
  {
    title: "Natural Language Processing",
    description:
      "Understand how Alris processes your commands and translates them into actions using advanced AI algorithms.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="url(#gradient)"
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
        />
      </svg>
    ),
    details: [
      "Context-aware command processing",
      "Multi-step action support",
      "Learning from user interactions",
    ],
  },
  {
    title: "Browser Integration",
    description:
      "Learn about Alris's seamless integration with your browser and how it enhances your browsing experience.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="url(#gradient)"
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      </svg>
    ),
    details: [
      "No extension required",
      "Cross-browser compatibility",
      "Progressive web app features",
    ],
  },
  {
    title: "Privacy & Security",
    description:
      "Discover how Alris collects and protects your data to provide personalized features.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="url(#gradient)"
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    details: [
      "Secure data collection",
      "Data encryption",
      "Personalized experience",
    ],
  },
];

const TopicCard = ({
  topic,
  index,
}: {
  topic: (typeof topics)[0];
  index: number;
}) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="relative group p-6 bg-[#12121A] rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 blur-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
      <div className="absolute top-6 left-6 rounded-lg p-3 text-white">
        {topic.icon}
      </div>
      <div className="ml-16">
        <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          {topic.title}
        </h3>
        <p className="mt-2 text-gray-400">{topic.description}</p>
        <ul className="mt-4 space-y-2">
          {topic.details.map((detail, i) => (
            <li key={i} className="flex items-center text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 mr-2"></span>
              {detail}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

const LearnMore = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section id="learn-more" className="py-20 bg-[#0A0A0F]">
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
            Dive Deeper into Alris
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400">
            Explore the technology and features that make Alris your perfect
            browsing companion.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic, index) => (
            <TopicCard key={topic.title} topic={topic} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LearnMore;

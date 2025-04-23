"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0A0F]/80 backdrop-blur-lg border-b border-purple-500/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-shrink-0"
          >
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Alris
              </span>
            </Link>
          </motion.div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#how-to-use">How to Use</NavLink>
              {/* <NavLink href="#learn-more">Learn More</NavLink> */}
              <NavLink href="https://github.com/Daniel-16/alris">
                Documentation
              </NavLink>
              <Link href="/chat" className="relative group inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative block px-4 py-2 rounded-xl border-2 border-transparent bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-[length:200%_auto] animate-gradient">
                  <span className="text-white font-medium">Get Started</span>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </span>
              </Link>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-purple-400 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`h-6 w-6 transition-transform duration-300 ${
                  isOpen ? "transform rotate-180" : ""
                }`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#12121A] border-b border-purple-500/20"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <MobileNavLink href="#features" onClick={() => setIsOpen(false)}>
                Features
              </MobileNavLink>
              <MobileNavLink
                href="#how-to-use"
                onClick={() => setIsOpen(false)}
              >
                How to Use
              </MobileNavLink>
              <MobileNavLink
                href="#learn-more"
                onClick={() => setIsOpen(false)}
              >
                Learn More
              </MobileNavLink>
              <MobileNavLink
                href="https://github.com/Daniel-16/alris"
                onClick={() => setIsOpen(false)}
              >
                Documentation
              </MobileNavLink>
              <Link
                href="/chat"
                onClick={() => setIsOpen(false)}
                className="block w-full px-4 py-3 text-center rounded-lg bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition-all duration-300"
              >
                Launch App
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gradient bg-gradient-to-r from-gray-400 via-purple-400 to-gray-400 bg-[length:200%_auto] animate-gradient hover:from-purple-400 hover:via-blue-400 hover:to-purple-400 transition-all duration-300"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="text-gradient bg-gradient-to-r from-gray-400 via-purple-400 to-gray-400 bg-[length:200%_auto] animate-gradient hover:from-purple-400 hover:via-blue-400 hover:to-purple-400 transition-all duration-300"
    >
      {children}
    </Link>
  );
};

const MobileNavLink = ({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className="block px-4 py-3 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-300"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-3 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-300"
    >
      {children}
    </Link>
  );
};

export default Navbar;

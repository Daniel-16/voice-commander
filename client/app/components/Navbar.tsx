"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

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
        scrolled ? "bg-white shadow-lg" : "bg-transparent"
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
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Alris
              </span>
            </Link>
          </motion.div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#how-to-use">How to Use</NavLink>
              <NavLink href="#docs">Documentation</NavLink>
              <Link href="/chat" className="relative group inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative block px-4 py-2 rounded-lg border-2 border-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] animate-gradient">
                  <span className="text-white font-medium">Launch App</span>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="text-gradient bg-gradient-to-r from-gray-600 via-blue-600 to-gray-600 bg-[length:200%_auto] animate-gradient hover:from-blue-600 hover:via-purple-500 hover:to-blue-600 transition-all duration-300"
  >
    {children}
  </Link>
);

export default Navbar;

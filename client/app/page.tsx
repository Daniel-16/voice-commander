"use client";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import ExampleCommands from "./components/ExampleCommands";
import HowToUse from "./components/HowToUse";
import LearnMore from "./components/LearnMore";
import Link from "next/link";
import { useAuth } from "./utils/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/chat");
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] overflow-x-hidden">
      <Navbar />
      <Hero />
      <ExampleCommands />
      <Features />
      <HowToUse />
      <LearnMore />

      {/* Footer */}
      <footer className="bg-[#12121A]">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">
                Product
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a
                    href="#features"
                    className="text-base text-gray-400 hover:text-purple-400"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-to-use"
                    className="text-base text-gray-400 hover:text-purple-400"
                  >
                    How to Use
                  </a>
                </li>
                <li>
                  <a
                    href="/chat"
                    className="text-base text-gray-400 hover:text-purple-400"
                  >
                    Launch App
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">
                Support
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a
                    href="https://github.com/Daniel-16/alris"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-gray-400 hover:text-purple-400"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-base text-gray-400 hover:text-purple-400"
                  >
                    FAQs
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-base text-gray-400 hover:text-purple-400"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">
                Legal
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-base text-gray-400 hover:text-purple-400"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-base text-gray-400 hover:text-purple-400"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; {new Date().getFullYear()} Alris. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

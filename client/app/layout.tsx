import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Alris - Voice & Text Commands for Your Browser",
  description:
    "Control your browser naturally with voice and text commands. Alris makes browsing effortless with powerful automation capabilities.",
  keywords:
    "voice commands, browser control, automation, productivity, browser extension",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

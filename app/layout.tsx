import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import "rsuite/dist/rsuite.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CallTrainer – Emergency Call Training Simulator 155",
    template: "%s | CallTrainer",
  },
  description:
    "Interactive simulation platform for training emergency operators – CallTrainer. Built with FastAPI, HuggingFace, Postgres and Next.js.",
  applicationName: "CallTrainer",
  keywords: [
    "CallTrainer",
    "Simulation",
    "Emergency",
    "Training",
    "FastAPI",
    "Next.js",
    "AI",
  ],
  authors: [{ name: "CallTrainer Team" }],
  creator: "CallTrainer Dev Team",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "CallTrainer – AI-powered training for emergency call operators",
    description:
      "Realistic emergency call simulation powered by AI. Train operators for real life calls like 155 hotline.",
    url: "http://localhost:3000",
    siteName: "CallTrainer",
    locale: "en_US",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-gray-100 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

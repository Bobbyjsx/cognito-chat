import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster as SonnerToaster } from "sonner";
import { SessionProvider } from "next-auth/react";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Cognito Chat",
    template: "%s | Cognito",
  },
  description:
    "A modern conversational AI application built with Next.js, FastAPI, Firestore, and Google Antigravity SDK.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable}`}>
        <SessionProvider
          // Avoid extra /api/auth/session round-trips on every focus
          refetchOnWindowFocus={false}
          refetchInterval={0}
        >
          <Providers>
            {children}
            <SonnerToaster richColors theme="light" />
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}

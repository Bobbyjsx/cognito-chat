import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster as SonnerToaster } from "sonner";
import "./globals.css";
import { Providers } from "./providers";

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Cognito Chat",
    template: "%s | Cognito",
  },
  description:
    "Meet Cognito — your AI companion for getting things done. Chat naturally, attach files, and keep every conversation and document organized in one searchable library.",
  openGraph: {
    title: "Cognito Chat",
    description:
      "Meet Cognito — your AI companion for getting things done. Chat naturally, attach files, and keep every conversation and document organized in one searchable library.",
    url: "https://cognito-chat.example.com",
    siteName: "Cognito",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cognito Chat",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cognito Chat",
    description:
      "Meet Cognito — your AI companion for getting things done. Chat naturally, attach files, and keep every conversation and document organized in one searchable library.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/cognito-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon-32.png",
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
      <body
        className={cn(
          geist.variable,
          geistMono.variable,
          "h-[calc(100dvh-10px)] sm:h-dvh",
        )}
      >
        <SessionProvider refetchInterval={0}>
          <Providers>
            {children}
            <SonnerToaster richColors theme="light" />
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}

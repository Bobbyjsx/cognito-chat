import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster as SonnerToaster } from "sonner";

import "./globals.css";
import { Providers } from "./providers";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TITLE,
  APP_URL,
  OG_IMAGE,
  OG_IMAGE_PNG,
  noIndexRobots,
} from "@/lib/site";

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
  metadataBase: new URL(APP_URL),

  title: {
    default: APP_TITLE,
    template: "%s | Cognito",
  },

  description: APP_DESCRIPTION,

  applicationName: APP_NAME,

  authors: [
    {
      name: "Godswill Ezeala",
      url: "https://godswillezeala.online",
    },
  ],

  creator: "Godswill Ezeala",
  publisher: "Godswill Ezeala",

  category: "technology",

  robots: noIndexRobots,

  openGraph: {
    type: "website",
    siteName: APP_NAME,
    locale: "en_US",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [OG_IMAGE_PNG, OG_IMAGE],
  },

  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [OG_IMAGE.url],
  },

  icons: {
    icon: [
      {
        url: "/favicon/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
    shortcut: "/favicon/favicon-32x32.png",
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  manifest: "/favicon/site.webmanifest",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={cn(geist.variable, geistMono.variable, "min-h-dvh")}>
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

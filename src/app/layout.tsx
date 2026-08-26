import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster as SonnerToaster } from "sonner";

import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "@/components/modules/pwa/ServiceWorkerRegister";
import { PwaInstallPrompt } from "@/components/modules/pwa/PwaInstallPrompt";
import { PwaUpdatePrompt } from "@/components/modules/pwa/PwaUpdatePrompt";
import { AppStartupScreen } from "@/components/modules/pwa/AppStartupScreen";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TITLE,
  APP_URL,
  OG_IMAGE,
  OG_IMAGE_PNG,
  indexRobots,
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

  robots: indexRobots,

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

  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FBFBFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth bg-[#FBFBFA]">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `html,body{background-color:#FBFBFA;color:#111111;}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem("cognito_startup_shown") === "true") {
                  document.documentElement.classList.add("skip-startup");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={cn(
          geist.variable,
          geistMono.variable,
          "min-h-dvh bg-[#FBFBFA]",
        )}
      >
        <AppStartupScreen />
        <SessionProvider refetchInterval={0}>
          <Providers>
            {children}
            <SonnerToaster richColors theme="light" />
            <ServiceWorkerRegister />
            <PwaInstallPrompt />
            <PwaUpdatePrompt />
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}

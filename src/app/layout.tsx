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
    <html
      lang="en"
      className="scroll-smooth bg-[#FBFBFA]"
      suppressHydrationWarning
    >
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `html,body{background-color:#FBFBFA;color:#111111;}
.startup-screen{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#FBFBFA;color:#111;padding:0 16px;user-select:none;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transition:opacity .45s ease,transform .45s ease}
.startup-screen.is-exiting{opacity:0;transform:scale(1.02);pointer-events:none}
html.skip-startup .startup-screen{display:none!important}
.startup-logo{animation:startup-pulse 1s ease-in-out infinite}
@keyframes startup-pulse{50%{opacity:.55}}
.startup-copy{margin-top:24px;text-align:center}
.startup-type-row{display:flex;min-height:28px;align-items:center;justify-content:center}
.startup-type{display:inline-block;overflow:hidden;white-space:nowrap;font-size:14px;font-weight:500;letter-spacing:-.02em;max-width:0;animation:startup-type 1.1s steps(29,end) forwards}
.startup-type.is-static{animation:none;max-width:none}
@keyframes startup-type{to{max-width:32ch}}
.startup-caret{margin-left:1px;color:#2f3437;animation:startup-blink 1s step-end infinite}
@keyframes startup-blink{50%{opacity:0}}
.startup-kicker{display:block;margin-top:6px;font-size:11px;color:#787774}
@media (prefers-reduced-motion:reduce){.startup-type,.startup-logo,.startup-caret{animation:none}.startup-type{max-width:none}}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var params = new URLSearchParams(location.search);
                var forceStartup = params.get("startup") === "1";
                var standalone =
                  window.matchMedia("(display-mode: standalone)").matches ||
                  window.matchMedia("(display-mode: fullscreen)").matches ||
                  window.matchMedia("(display-mode: minimal-ui)").matches ||
                  window.navigator.standalone === true ||
                  document.referrer.indexOf("android-app://") !== -1;
                var shown = sessionStorage.getItem("cognito_startup_shown") === "true";
                if (!forceStartup && (shown || !standalone)) {
                  document.documentElement.classList.add("skip-startup");
                }
                window.__COGNITO_STARTUP_AT = performance.now();
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

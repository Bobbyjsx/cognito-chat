import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster as SonnerToaster } from "sonner";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Cognito-Chat - AI Assistant Powered by Antigravity SDK",
  description:
    "A modern conversational AI application built with Next.js, FastAPI, Firestore, and Google Antigravity SDK.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans bg-slate-950 text-white antialiased`}
      >
        <SessionProvider>
          <Providers>
            {children}
            <SonnerToaster richColors theme="dark" />
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}

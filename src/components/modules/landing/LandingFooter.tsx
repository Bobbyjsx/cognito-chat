"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { APP_NAME } from "@/lib/site";

export function LandingFooter() {
  return (
    <footer className="border-t border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        {/* Brand & Tagline */}
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          <Logo
            textClassName="text-[#111111] text-sm font-semibold"
            iconClassName="text-[#111111]"
          />
          <span className="hidden text-[#deddda] sm:inline">|</span>
          <span className="text-xs text-[#787774]">
            The multi-model workspace for Gemini, Claude, and ChatGPT.
          </span>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-[#787774]">
          <a href="#problem" className="transition-colors hover:text-[#111111]">
            The Problem
          </a>
          <a
            href="#value-props"
            className="transition-colors hover:text-[#111111]"
          >
            Benefits
          </a>
          <a href="#money" className="transition-colors hover:text-[#111111]">
            Save Money
          </a>
          <a href="#compare" className="transition-colors hover:text-[#111111]">
            Compare
          </a>
          <a href="#pricing" className="transition-colors hover:text-[#111111]">
            Pricing
          </a>
          <a href="#faq" className="transition-colors hover:text-[#111111]">
            FAQ
          </a>
          <Link
            href="/login"
            className="transition-colors hover:text-[#111111]"
          >
            Sign In
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-5xl flex-col items-center justify-between gap-3 border-t border-[rgba(0,0,0,0.06)] pt-5 text-xs text-[#787774] sm:flex-row">
        <p>
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#346538]" />
          <span>Anthropic, Google & OpenAI Operational</span>
        </div>
      </div>
    </footer>
  );
}

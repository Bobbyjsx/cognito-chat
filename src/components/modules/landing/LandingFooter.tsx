"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Spinner } from "@/components/ui/spinner";
import { useLoginRedirect } from "@/hooks/useLoginRedirect";
import { APP_NAME } from "@/lib/site";

export function LandingFooter() {
  const { isLoggingIn, login } = useLoginRedirect();
  const handleScrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
  };

  const handleScrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navHeight = 90;
        const targetTop =
          target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: targetTop, behavior: "smooth" });
        history.pushState(null, "", href);
      }
    }
  };

  return (
    <footer className="border-t border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        {/* Brand & Tagline */}
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          <Link
            href="/"
            onClick={handleScrollToTop}
            aria-label="Cognito Home"
            className="cursor-pointer transition-transform active:scale-[0.98]"
          >
            <Logo
              textClassName="text-[#111111] text-sm font-semibold"
              iconClassName="text-[#111111]"
            />
          </Link>
          <span className="hidden text-[#deddda] sm:inline">|</span>
          <span className="text-xs text-[#787774]">
            The multi-model workspace for Gemini, Claude, and ChatGPT.
          </span>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-[#787774]">
          <a
            href="#problem"
            onClick={(e) => handleScrollToSection(e, "#problem")}
            className="cursor-pointer transition-colors hover:text-[#111111]"
          >
            The Problem
          </a>
          <a
            href="#value-props"
            onClick={(e) => handleScrollToSection(e, "#value-props")}
            className="cursor-pointer transition-colors hover:text-[#111111]"
          >
            Benefits
          </a>
          <a
            href="#money"
            onClick={(e) => handleScrollToSection(e, "#money")}
            className="cursor-pointer transition-colors hover:text-[#111111]"
          >
            Save Money
          </a>
          <a
            href="#compare"
            onClick={(e) => handleScrollToSection(e, "#compare")}
            className="cursor-pointer transition-colors hover:text-[#111111]"
          >
            Compare
          </a>
          <a
            href="#pricing"
            onClick={(e) => handleScrollToSection(e, "#pricing")}
            className="cursor-pointer transition-colors hover:text-[#111111]"
          >
            Pricing
          </a>
          <a
            href="#faq"
            onClick={(e) => handleScrollToSection(e, "#faq")}
            className="cursor-pointer transition-colors hover:text-[#111111]"
          >
            FAQ
          </a>
          <button
            type="button"
            onClick={login}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[#111111] disabled:opacity-70"
          >
            {isLoggingIn ? <Spinner className="size-3" /> : null}
            <span>Sign In</span>
          </button>
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

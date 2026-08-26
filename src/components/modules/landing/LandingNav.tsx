"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "#problem", label: "The Problem" },
  { href: "#value-props", label: "Benefits" },
  { href: "#money", label: "Save Money" },
  { href: "#compare", label: "Compare" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleScrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
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
      setMobileOpen(false);
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
    <>
      <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8">
          <nav className="relative flex items-center justify-between rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#FBFBFA]/85 px-4 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl sm:px-6">
            {/* Logo - Smooth scroll to top */}
            <Link
              href="/"
              onClick={handleScrollToTop}
              aria-label="Cognito Home"
              className="group flex cursor-pointer items-center gap-2 transition-transform active:scale-[0.98]"
            >
              <Logo
                textClassName="text-[#111111] text-base tracking-tight font-semibold"
                iconClassName="text-[#111111] group-hover:scale-105 transition-transform"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden items-center gap-1 lg:flex xl:gap-1.5">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleScrollToSection(e, item.href)}
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-[#787774] transition-all duration-150 hover:bg-[#F7F6F3] hover:text-[#111111] active:scale-[0.97] xl:text-sm"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                prefetch={false}
                className="hidden rounded-lg px-3.5 py-1.5 text-xs font-medium text-[#787774] transition-all duration-150 hover:bg-[#F7F6F3] hover:text-[#111111] active:scale-[0.97] sm:inline-flex sm:text-sm"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                prefetch={false}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#111111] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-all duration-150 hover:bg-[#2f3437] active:scale-[0.97] sm:text-sm"
              >
                <span>Get Started</span>
                <ArrowRight className="size-3.5" />
              </Link>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="rounded-lg p-1.5 text-[#787774] transition-colors hover:bg-[#F7F6F3] hover:text-[#111111] focus:outline-none lg:hidden"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="fixed inset-x-4 top-20 z-40 flex flex-col gap-2 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#FBFBFA]/98 p-5 shadow-xl backdrop-blur-2xl lg:hidden"
          >
            <div className="flex flex-col gap-1 border-b border-[rgba(0,0,0,0.06)] pb-4">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleScrollToSection(e, item.href)}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-[#787774] transition-colors hover:bg-[#F7F6F3] hover:text-[#111111]"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                className="w-full rounded-lg py-2 text-center text-sm font-medium text-[#787774] transition-colors hover:bg-[#F7F6F3] hover:text-[#111111]"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                className="w-full rounded-lg bg-[#111111] py-2.5 text-center text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#2f3437]"
              >
                Start Using Cognito
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

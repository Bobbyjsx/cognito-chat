"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, BookMarked, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInputFocusedRef = useRef(false);

  useEffect(() => {
    // 1. Hide menu bar when typing/focusing an input
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.getAttribute("role") === "textbox";

      if (isInput) {
        isInputFocusedRef.current = true;
        setIsVisible(false);
      }
    };

    const handleFocusOut = () => {
      isInputFocusedRef.current = false;
      setTimeout(() => {
        if (!isInputFocusedRef.current) {
          setIsVisible(true);
        }
      }, 150);
    };

    // 2. Hide menu bar ONLY while scrolling is active; reappear 600ms after scrolling stops
    const handleScroll = () => {
      if (isInputFocusedRef.current) return;

      // Hide immediately during active scroll
      setIsVisible(false);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Re-appear 600ms after scroll finishes
      scrollTimeoutRef.current = setTimeout(() => {
        if (!isInputFocusedRef.current) {
          setIsVisible(true);
        }
      }, 600);
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  // In active chat window (/chat or /chat/[sessionId]), the floating bottom menu bar is hidden
  const isChatWindow = pathname === "/chat" || pathname.startsWith("/chat/");
  const isChatsList = pathname === "/chats" || pathname.startsWith("/chats/");
  const isLibrary = pathname.startsWith("/library");
  const isSettings = pathname.startsWith("/settings");

  if (isChatWindow) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className={cn(
        "fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-[#EAEAEA] bg-white/95 p-1 shadow-[0_4px_20px_rgb(0,0,0,0.08)] backdrop-blur-xl transition-all duration-300 ease-out sm:bottom-4 md:hidden dark:border-white/10 dark:bg-[#18181b]/95",
        isVisible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-20 opacity-0",
      )}
    >
      {/* Chats (direct link to dedicated /chats page) */}
      <Link
        href="/chats"
        className={cn(
          "group relative flex h-8 min-w-[58px] items-center justify-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all select-none active:scale-95",
          isChatsList
            ? "bg-[#111111] font-semibold text-white shadow-2xs dark:bg-white dark:text-[#111111]"
            : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] active:bg-[#EEEEEE] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white",
        )}
        aria-current={isChatsList ? "page" : undefined}
      >
        <MessageSquare
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            isChatsList ? "stroke-[2.25px]" : "stroke-[1.75px]",
          )}
        />
        <span>Chats</span>
      </Link>

      {/* Library */}
      <Link
        href="/library"
        className={cn(
          "group relative flex h-8 min-w-[58px] items-center justify-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all select-none active:scale-95",
          isLibrary
            ? "bg-[#111111] font-semibold text-white shadow-2xs dark:bg-white dark:text-[#111111]"
            : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] active:bg-[#EEEEEE] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white",
        )}
        aria-current={isLibrary ? "page" : undefined}
      >
        <BookMarked
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            isLibrary ? "stroke-[2.25px]" : "stroke-[1.75px]",
          )}
        />
        <span>Library</span>
      </Link>

      {/* Settings */}
      <Link
        href="/settings"
        className={cn(
          "group relative flex h-8 min-w-[58px] items-center justify-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all select-none active:scale-95",
          isSettings
            ? "bg-[#111111] font-semibold text-white shadow-2xs dark:bg-white dark:text-[#111111]"
            : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] active:bg-[#EEEEEE] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white",
        )}
        aria-current={isSettings ? "page" : undefined}
      >
        <Settings
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            isSettings ? "stroke-[2.25px]" : "stroke-[1.75px]",
          )}
        />
        <span>Settings</span>
      </Link>
    </nav>
  );
}

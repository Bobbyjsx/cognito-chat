"use client";

import { useEffect, useState } from "react";
import { CognitoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const WITTY_PHRASES = [
  "Waking up neural pathways...",
  "Spinning up intelligence engines...",
  "Preparing your cognitive space...",
  "Calibrating creative frequencies...",
  "Connecting synaptic bridges...",
  "Almost ready for you...",
];

export function AppStartupScreen() {
  const [isComplete, setIsComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("cognito_startup_shown") === "true") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsComplete(true);
        return;
      }
    } catch {}

    // Minimum display timer (2000ms) to ensure typewriter text is readable during cold start
    const minDisplayTimer = setTimeout(() => {
      setIsFadingOut(true);
      try {
        sessionStorage.setItem("cognito_startup_shown", "true");
      } catch {}

      const exitTimerId = setTimeout(() => {
        setIsComplete(true);
      }, 500); // matches 500ms fade transition

      // Cleanup exit timer if component unmounts early
      return () => clearTimeout(exitTimerId);
    }, 2000);

    return () => clearTimeout(minDisplayTimer);
  }, []);

  // Custom Typewriter Effect (safe, no external library hydration issues)
  useEffect(() => {
    if (isComplete || isFadingOut) return;

    let i = 0;
    const currentPhrase = WITTY_PHRASES[phraseIndex % WITTY_PHRASES.length];

    const interval = setInterval(() => {
      setText(currentPhrase.slice(0, i + 1));
      i++;
      if (i >= currentPhrase.length) {
        clearInterval(interval);
        setTimeout(() => {
          setPhraseIndex((p) => p + 1);
        }, 1500);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [phraseIndex, isComplete, isFadingOut]);

  if (isComplete) {
    return null;
  }

  return (
    <div
      className={cn(
        "startup-screen fixed inset-0 z-[99999] flex h-dvh w-dvw flex-col items-center justify-center bg-[#FBFBFA] px-4 font-sans transition-all duration-500 ease-out select-none",
        isFadingOut
          ? "pointer-events-none scale-[1.02] opacity-0"
          : "opacity-100",
      )}
      aria-live="polite"
      aria-label="Preparing application"
    >
      <div className="relative flex flex-col items-center justify-center gap-6">
        {/* Logo sitting flush directly with the background */}
        <div className="relative flex items-center justify-center">
          <CognitoIcon
            size={54}
            className="animate-pulse text-[#111111] duration-1000"
          />
        </div>

        {/* Dynamic Typewriter Text */}
        <div className="flex flex-col items-center justify-center gap-1.5 text-center">
          <div className="flex min-h-[28px] items-center justify-center">
            <span className="font-body-md text-sm font-medium tracking-tight text-[#111111] sm:text-base">
              {text || WITTY_PHRASES[0].slice(0, 1)}
            </span>
            <span className="ml-[1px] animate-pulse text-[#2f3437]">|</span>
          </div>
          <span className="text-[11px] text-[#787774] sm:text-xs">
            Cognito AI Workspace
          </span>
        </div>
      </div>
    </div>
  );
}

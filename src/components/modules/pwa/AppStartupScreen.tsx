"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { subscribeStartupReady } from "./startup-ready";

const WITTY_PHRASES = [
  "Waking up neural pathways...",
  "Spinning up intelligence engines...",
  "Preparing your cognitive space...",
  "Calibrating creative frequencies...",
  "Connecting synaptic bridges...",
  "Almost ready for you...",
];

const FIRST_PHRASE = WITTY_PHRASES[0];
const MIN_VISIBLE_MS = 1600;
const MAX_WAIT_MS = 2800;
const EXIT_MS = 450;

export function AppStartupScreen() {
  const [isComplete, setIsComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    let fadeTimer: number | undefined;
    let exitTimer: number | undefined;
    let cancelled = false;
    let exiting = false;

    const skip =
      document.documentElement.classList.contains("skip-startup") ||
      sessionStorage.getItem("cognito_startup_shown") === "true";

    if (skip) {
      const skipTimer = window.setTimeout(() => setIsComplete(true), 0);
      return () => window.clearTimeout(skipTimer);
    }

    const startedAt = window.__COGNITO_STARTUP_AT ?? 0;

    const startExit = () => {
      if (cancelled || exiting) return;
      exiting = true;
      try {
        sessionStorage.setItem("cognito_startup_shown", "true");
      } catch {}
      setIsFadingOut(true);
      exitTimer = window.setTimeout(() => {
        if (!cancelled) setIsComplete(true);
      }, EXIT_MS);
    };

    const exitAfterMinimum = () => {
      const elapsed = performance.now() - startedAt;
      fadeTimer = window.setTimeout(
        startExit,
        Math.max(0, MIN_VISIBLE_MS - elapsed),
      );
    };

    const unsubscribe = subscribeStartupReady(exitAfterMinimum);
    const maxTimer = window.setTimeout(
      startExit,
      Math.max(0, MAX_WAIT_MS - (performance.now() - startedAt)),
    );

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearTimeout(fadeTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    if (isComplete || isFadingOut) return;

    const holdTimer = window.setTimeout(() => {
      setPhraseIndex(1);
      setText("");
    }, 2000);

    return () => window.clearTimeout(holdTimer);
  }, [isComplete, isFadingOut]);

  useEffect(() => {
    if (isComplete || isFadingOut || phraseIndex === 0) return;

    let i = 0;
    let nextTimer: number | undefined;
    const currentPhrase = WITTY_PHRASES[phraseIndex % WITTY_PHRASES.length];
    const interval = window.setInterval(() => {
      setText(currentPhrase.slice(0, i + 1));
      i += 1;
      if (i >= currentPhrase.length) {
        window.clearInterval(interval);
        nextTimer = window.setTimeout(() => {
          setPhraseIndex((current) => current + 1);
        }, 1200);
      }
    }, 40);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(nextTimer);
    };
  }, [phraseIndex, isComplete, isFadingOut]);

  if (isComplete) return null;

  const usingCssTypewriter = text === null;
  const displayText = text ?? FIRST_PHRASE;

  return (
    <div
      className={cn("startup-screen", isFadingOut && "is-exiting")}
      aria-live="polite"
      aria-label="Preparing application"
    >
      <div className="startup-logo">
        {/* Inline <img> so the splash does not wait on next/image JS */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cognito-icon.svg"
          width={54}
          height={54}
          alt=""
          decoding="sync"
          fetchPriority="high"
        />
      </div>
      <div className="startup-copy">
        <div className="startup-type-row">
          <span
            className={cn("startup-type", !usingCssTypewriter && "is-static")}
          >
            {displayText}
          </span>
          <span className="startup-caret">|</span>
        </div>
        <span className="startup-kicker">Cognito AI Workspace</span>
      </div>
    </div>
  );
}

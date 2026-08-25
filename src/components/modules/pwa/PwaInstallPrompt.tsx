"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Share,
  PlusSquare,
  X,
  Smartphone,
  Laptop,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY = "cognito_pwa_install_dismissed_at";
const DISMISS_COOLDOWN_DAYS = 7;

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true ||
    document.referrer.includes("android-app://")
  );
}

function checkIsDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const diffDays =
        (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      return diffDays < DISMISS_COOLDOWN_DAYS;
    }
  } catch {}
  return false;
}

function checkIsIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function checkIsMacSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isMac = /Macintosh/i.test(ua);
  const isSafari =
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg|OPR|Brave|Firefox/i.test(ua);
  return isMac && isSafari && !checkIsIos();
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);

  const isIos = React.useMemo(() => checkIsIos(), []);
  const isMacSafari = React.useMemo(() => checkIsMacSafari(), []);

  React.useEffect(() => {
    // If running in standalone (already installed) or dismissed recently, skip
    if (checkIsStandalone() || checkIsDismissed()) {
      return;
    }

    // Apple Devices (iPhone, iPad, Mac Safari): Show prompt after 2.5s delay
    if (checkIsIos() || checkIsMacSafari()) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // Chromium / Desktop Chrome / Edge / Brave / Android Flow: Listen for native beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      toast.success("Cognito Chat installed successfully!");
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info("Installation is not supported on this browser.");
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        toast.success("Installing Cognito Chat...");
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Install prompt error:", error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {}
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:bottom-6">
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={cn(
              "pointer-events-auto w-full max-w-[420px] rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all sm:p-5",
              "border-[rgba(0,0,0,0.08)] bg-white/95 text-[#111] dark:border-white/10 dark:bg-[#18181b]/95 dark:text-[#eee]",
            )}
          >
            {isIos ? (
              /* iPhone & iPad Step-by-Step Installation Guide */
              <div className="flex flex-col gap-3.5">
                <div className="border-border/50 flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.06)] bg-gradient-to-br from-neutral-100 to-neutral-200 p-1 shadow-xs dark:border-white/10 dark:from-neutral-800 dark:to-neutral-900">
                      <Logo logoOnly className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="text-primary h-3.5 w-3.5" />
                      <span className="text-foreground text-xs font-semibold">
                        Install on iPhone / iPad
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-muted-foreground space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold">
                      1
                    </span>
                    <p className="text-foreground leading-snug">
                      Tap the{" "}
                      <strong className="text-primary font-semibold">
                        Share
                      </strong>{" "}
                      icon{" "}
                      <span className="inline-flex align-middle">
                        <Share className="text-primary mx-0.5 inline h-3.5 w-3.5" />
                      </span>{" "}
                      in your Safari toolbar (at the bottom or top).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold">
                      2
                    </span>
                    <p className="text-foreground leading-snug">
                      Scroll down and tap{" "}
                      <strong className="text-foreground font-semibold">
                        &quot;Add to Home Screen&quot;
                      </strong>{" "}
                      <span className="inline-flex align-middle">
                        <PlusSquare className="text-muted-foreground mx-0.5 inline h-3.5 w-3.5" />
                      </span>
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold">
                      3
                    </span>
                    <p className="text-foreground leading-snug">
                      Tap{" "}
                      <strong className="text-primary font-semibold">
                        &quot;Add&quot;
                      </strong>{" "}
                      in the top-right corner to finish.
                    </p>
                  </div>
                </div>

                <div className="border-border/50 flex items-center justify-between border-t pt-2.5">
                  <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Full-screen app with offline support
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismiss}
                      className="text-muted-foreground hover:text-foreground h-7 rounded-xl px-2.5 text-xs"
                    >
                      Not now
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleDismiss}
                      className="h-7.5 rounded-xl px-3 text-xs font-semibold"
                    >
                      Got it
                    </Button>
                  </div>
                </div>
              </div>
            ) : isMacSafari ? (
              /* macOS Safari Step-by-Step Guide */
              <div className="flex flex-col gap-3.5">
                <div className="border-border/50 flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.06)] bg-gradient-to-br from-neutral-100 to-neutral-200 p-1 shadow-xs dark:border-white/10 dark:from-neutral-800 dark:to-neutral-900">
                      <Logo logoOnly className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Laptop className="text-primary h-3.5 w-3.5" />
                      <span className="text-foreground text-xs font-semibold">
                        Install on Mac Safari
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-muted-foreground space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold">
                      1
                    </span>
                    <p className="text-foreground leading-snug">
                      In the top Safari menu bar, click{" "}
                      <strong className="text-primary font-semibold">
                        File
                      </strong>{" "}
                      (or click the{" "}
                      <Share className="text-primary inline h-3.5 w-3.5" />{" "}
                      Share button in the toolbar).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold">
                      2
                    </span>
                    <p className="text-foreground leading-snug">
                      Click{" "}
                      <strong className="text-foreground font-semibold">
                        &quot;Add to Dock...&quot;
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold">
                      3
                    </span>
                    <p className="text-foreground leading-snug">
                      Click{" "}
                      <strong className="text-primary font-semibold">
                        &quot;Add&quot;
                      </strong>{" "}
                      to launch Cognito Chat as an independent Mac app.
                    </p>
                  </div>
                </div>

                <div className="border-border/50 flex items-center justify-between border-t pt-2.5">
                  <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Opens in full standalone Mac window
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismiss}
                      className="text-muted-foreground hover:text-foreground h-7 rounded-xl px-2.5 text-xs"
                    >
                      Not now
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleDismiss}
                      className="h-7.5 rounded-xl px-3 text-xs font-semibold"
                    >
                      Got it
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard 1-Click Banner (Chrome / Edge / Brave / Android) */
              <div className="flex flex-col gap-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(0,0,0,0.06)] bg-gradient-to-br from-neutral-100 to-neutral-200 p-2 shadow-xs dark:border-white/10 dark:from-neutral-800 dark:to-neutral-900">
                      <Logo logoOnly className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-foreground text-sm font-semibold tracking-tight">
                        Install Cognito Chat
                      </h3>
                      <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                        Fast, full-screen AI workspace with instant access.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-muted-foreground hover:text-foreground h-8 rounded-xl px-3 text-xs"
                  >
                    Not now
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleInstallClick}
                    className="h-8 gap-1.5 rounded-xl px-3.5 text-xs font-semibold shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Install App</span>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

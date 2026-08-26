"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    // @ts-expect-error - vendor prefix
    window.navigator.standalone === true
  );
}

export function PwaUpdatePrompt() {
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [waitingWorker, setWaitingWorker] =
    React.useState<ServiceWorker | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    // Listen for custom update events dispatched by ServiceWorkerRegister
    const handleCustomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        registration?: ServiceWorkerRegistration;
        waitingWorker?: ServiceWorker;
      }>;
      if (customEvent.detail?.waitingWorker) {
        setWaitingWorker(customEvent.detail.waitingWorker);
        if (isStandaloneMode()) setShowPrompt(true);
      }
    };

    window.addEventListener("cognito:sw-update", handleCustomUpdate);

    // Also inspect registration directly
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        if (isStandaloneMode()) setShowPrompt(true);
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(newWorker);
            if (isStandaloneMode()) setShowPrompt(true);
          }
        });
      });

      // Periodically check for updates every 30 minutes
      const interval = setInterval(
        () => {
          reg.update().catch(() => {});
        },
        1000 * 60 * 30,
      );

      // Check on tab focus / visibility
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          reg.update().catch(() => {});
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      window.removeEventListener("cognito:sw-update", handleCustomUpdate);
    };
  }, []);

  const handleUpdate = () => {
    setIsUpdating(true);
    toast.info("Updating Cognito Chat to the latest version...");

    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        } else {
          window.location.reload();
        }
      });
    }

    // Safety fallback: reload page after 750ms if controllerchange didn't fire
    setTimeout(() => {
      window.location.reload();
    }, 750);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  const pathname = usePathname();
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/oauth");

  if (isAuthRoute) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[99990] flex justify-center px-4 sm:bottom-6">
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={cn(
              "pointer-events-auto w-full max-w-[440px] rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all sm:p-5",
              "border-[rgba(0,0,0,0.08)] bg-white/95 text-[#111] dark:border-white/10 dark:bg-[#18181b]/95 dark:text-[#eee]",
            )}
            role="alertdialog"
            aria-labelledby="update-dialog-title"
            aria-describedby="update-dialog-desc"
          >
            <div className="flex items-start gap-3.5">
              <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3
                    id="update-dialog-title"
                    className="text-foreground text-sm font-semibold tracking-tight"
                  >
                    New version available
                  </h3>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                    aria-label="Close update prompt"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p
                  id="update-dialog-desc"
                  className="text-muted-foreground text-xs leading-relaxed"
                >
                  You are running an older version of Cognito. Update now to
                  access the latest features and improvements.
                </p>

                <div className="flex items-center gap-2 pt-2.5">
                  <Button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    size="sm"
                    className="h-8 rounded-xl px-4 text-xs font-medium shadow-xs"
                  >
                    <RefreshCw
                      className={cn(
                        "mr-1.5 h-3.5 w-3.5",
                        isUpdating && "animate-spin",
                      )}
                    />
                    {isUpdating ? "Updating..." : "Update"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    disabled={isUpdating}
                    className="text-muted-foreground hover:text-foreground h-8 rounded-xl px-3 text-xs"
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

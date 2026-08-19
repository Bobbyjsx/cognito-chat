"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { initiateOAuth } from "@/lib/actions/oauth";

const COUNTDOWN_SECONDS = 5;

interface SessionExpiredDialogProps {
  isOpen?: boolean;
}

export function SessionExpiredDialog({
  isOpen: explicitOpen,
}: SessionExpiredDialogProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/oauth") ||
    pathname?.startsWith("/api/auth");

  const isSessionError =
    (session as unknown as { error?: string })?.error ===
    "RefreshAccessTokenError";
  const open = !isAuthRoute && Boolean(explicitOpen || isSessionError);

  const handleReauthenticate = async () => {
    setIsLoading(true);
    try {
      await initiateOAuth();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  // Tick the countdown while the dialog is open
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          void handleReauthenticate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      // Reset for the next time the dialog opens
      setCountdown(COUNTDOWN_SECONDS);
    };
  }, [open]);

  if (!open) return null;

  // SVG ring progress
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = (countdown / COUNTDOWN_SECONDS) * circumference;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center gap-3 text-center sm:text-left">
          <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-full">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <DialogTitle className="text-foreground text-lg font-semibold">
            Session Expired
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-center text-sm">
            Your authentication session has expired or could not be refreshed
            automatically. Please sign in again to continue using Cognito Chat.
          </DialogDescription>
        </DialogHeader>

        {/* Countdown ring */}
        <div className="flex flex-col items-center gap-1 py-2">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg
              className="-rotate-90"
              width="56"
              height="56"
              viewBox="0 0 56 56"
            >
              {/* Track */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                strokeWidth="4"
                className="stroke-muted"
              />
              {/* Progress */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                className="stroke-destructive transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="text-foreground absolute text-lg font-semibold tabular-nums">
              {countdown}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            Redirecting automatically…
          </p>
        </div>

        <DialogFooter className="mt-2 sm:justify-center">
          <Button
            onClick={handleReauthenticate}
            className="w-full sm:w-auto"
            variant="default"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Redirecting…" : "Sign In Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

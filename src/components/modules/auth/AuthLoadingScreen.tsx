"use client";

import * as React from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@bobslab/utils";

interface AuthLoadingScreenProps {
  title?: string;
  description?: string;
  error?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function AuthLoadingScreen({
  title = "Connecting to Cognito Identity...",
  description = "Redirecting you to secure authentication...",
  error,
  onRetry,
  retryLabel = "Try Again",
  className,
}: AuthLoadingScreenProps) {
  return (
    <div
      className={cn(
        "bg-background flex min-h-dvh flex-col items-center justify-center p-4 text-center",
        className,
      )}
    >
      <div className="border-border/60 bg-card w-full max-w-sm rounded-2xl border p-8 shadow-lg">
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-4">
          <Logo className="justify-center" />
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-3">
          {error ? (
            <div className="space-y-4 pt-2">
              <div className="bg-destructive/10 text-destructive border-destructive/20 mx-auto flex h-10 w-10 items-center justify-center rounded-full border">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-foreground text-base font-semibold">
                  Authentication Failed
                </h2>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {error}
                </p>
              </div>

              {onRetry && (
                <div className="pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onRetry}
                    className="w-full cursor-pointer gap-2 rounded-xl font-medium"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>{retryLabel}</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <h2 className="text-foreground text-base font-semibold">
                  {title}
                </h2>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="text-muted-foreground flex items-center justify-center gap-2 pt-2 text-xs">
                <Loader2 className="text-primary h-4 w-4 animate-spin" />
                <span>Securing connection...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

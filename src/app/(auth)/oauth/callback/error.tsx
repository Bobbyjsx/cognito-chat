"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function OAuthCallbackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("OAuth callback error:", error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col items-center space-y-8 text-center">
        <Logo logoOnly />
        <div className="space-y-2">
          <h1 className="text-foreground text-xl font-medium">
            Sign in failed
          </h1>
          <p className="text-muted-foreground text-sm">
            {error.message || "An error occurred during sign in"}
          </p>
        </div>
        <Button onClick={() => reset()} className="h-10 w-fit px-5">
          Try again
        </Button>
      </div>
    </div>
  );
}

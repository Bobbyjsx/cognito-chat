"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { AuthLoadingScreen } from "@/components/modules/auth/AuthLoadingScreen";

function CallbackContent() {
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const exchangedRef = React.useRef(false);

  const completeExchange = React.useCallback(async () => {
    if (!searchParams) return;

    const urlError = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (urlError || errorDescription) {
      setError(
        errorDescription ||
          urlError ||
          "Sign-in was cancelled or encountered an error.",
      );
      return;
    }

    if (!code || !state) {
      setError("Missing authentication code or state parameter.");
      return;
    }

    try {
      const res = await fetch("/api/auth/oauth/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ code, state }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Failed to complete authentication exchange.",
        );
      }

      const destination = data.returnTo || "/chat";
      window.location.replace(destination);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to secure session. Please try logging in again.";
      setError(msg);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;
    void completeExchange();
  }, [completeExchange]);

  return (
    <AuthLoadingScreen
      title="Completing Sign-In"
      description="Securing your session and loading your account..."
      error={error}
      onRetry={() => {
        window.location.replace("/login");
      }}
      retryLabel="Return to Sign In"
    />
  );
}

export default function OAuthCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <AuthLoadingScreen
          title="Completing Sign-In"
          description="Securing your session..."
        />
      }
    >
      <CallbackContent />
    </React.Suspense>
  );
}

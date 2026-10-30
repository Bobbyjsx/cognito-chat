"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { AuthLoadingScreen } from "@/components/modules/auth/AuthLoadingScreen";

function LoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const initiatedRef = React.useRef(false);

  const startLoginFlow = React.useCallback(async () => {
    setError(null);
    try {
      const query = searchParams ? searchParams.toString() : "";
      const endpoint = query
        ? `/api/auth/oauth/authorize?${query}`
        : "/api/auth/oauth/authorize";

      const res = await fetch(endpoint, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Failed to initialize login (status ${res.status})`);
      }

      const data = await res.json();
      if (data.redirectUrl) {
        window.location.replace(data.redirectUrl);
      } else {
        throw new Error("Missing redirect destination from identity server");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to connect to identity service. Please try again.";
      setError(msg);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (initiatedRef.current) return;
    initiatedRef.current = true;
    void startLoginFlow();
  }, [startLoginFlow]);

  return (
    <AuthLoadingScreen
      title="Connecting to Cognito Identity"
      description="Redirecting you to secure authentication..."
      error={error}
      onRetry={() => {
        initiatedRef.current = false;
        void startLoginFlow();
      }}
      retryLabel="Retry Sign In"
    />
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <AuthLoadingScreen
          title="Connecting to Cognito Identity"
          description="Preparing authentication..."
        />
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}

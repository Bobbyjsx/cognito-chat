"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { completeOAuthLogin } from "@/lib/actions/oauth";
import { authManager } from "@/lib/auth-manager";
import { Loader } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const syncError =
    errorDescription ||
    urlError ||
    (!code || !state ? "Malicious Auth Session" : null);

  const [asyncError, setAsyncError] = useState<string | null>(null);
  const error = syncError || asyncError;

  const [isNavigatingBack, setIsNavigatingBack] = useState(false);
  const processed = useRef(false);

  const exchangeToken = async (state: string, code: string) => {
    try {
      authManager.clearBrowserSessionCache();
      const resultData = await completeOAuthLogin(code, state);
      
      if (resultData.error || !resultData.tokens || !resultData.user) {
        throw new Error(resultData.error || "Failed to complete login");
      }

      const { tokens, user } = resultData;

      const result = await signIn("manual-oauth", {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        userStr: JSON.stringify(user),
        redirect: false,
      });
      if (result?.error) {
        throw new Error(result.error);
      }
      authManager.clearBrowserSessionCache();
      router.replace("/chat");
    } catch (err: unknown) {
      console.error("OAuth callback error:", err);
      const digest =
        typeof err === "object" && err && "digest" in err
          ? String((err as { digest?: unknown }).digest)
          : "";
      if (digest.startsWith("NEXT_REDIRECT")) return;
      const message =
        err instanceof Error ? err.message : "An error occurred during sign in";
      setAsyncError(message);
    }
  };

  useEffect(() => {
    if (processed.current || syncError) return;
    processed.current = true;

    exchangeToken(state as string, code as string);
  }, [searchParams, syncError, state, code]);

  const handleReturnToLogin = () => {
    setIsNavigatingBack(true);
    router.push("/login");
  };

  if (error) {
    return (
      <div className="bg-background flex min-h-dvh flex-col items-center justify-center p-4">
        <div className="flex w-full max-w-sm flex-col items-center space-y-8 text-center">
          <Logo logoOnly />

          <div className="space-y-2">
            <h1 className="text-foreground text-xl font-medium">
              Opps, an error occurred!
            </h1>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>

          <Button
            onClick={handleReturnToLogin}
            className="h-10! w-fit px-5!"
            disabled={isNavigatingBack}
          >
            {isNavigatingBack && (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            )}
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col items-center space-y-8 text-center">
        <Logo logoOnly />

        <div className="flex flex-col items-center space-y-3">
          <Loader className="text-muted-foreground h-6 w-6 animate-spin" />
          <p className="text-muted-foreground text-sm">Authenticating...</p>
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-dvh flex-col items-center justify-center p-4">
          <div className="flex w-full max-w-sm flex-col items-center space-y-8 text-center">
            <Logo logoOnly />
            <div className="flex flex-col items-center space-y-3">
              <Loader className="text-muted-foreground h-6 w-6 animate-spin" />
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}

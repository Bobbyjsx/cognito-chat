"use client";

import { useCallback, useState } from "react";

/**
 * Hook providing a login redirect handler with immediate loading state feedback.
 */
export function useLoginRedirect() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = useCallback((e?: React.MouseEvent, callbackUrl?: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsLoggingIn(true);
    if (typeof window !== "undefined") {
      const href = callbackUrl
        ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/login";
      window.location.href = href;
    }
  }, []);

  return { isLoggingIn, login };
}

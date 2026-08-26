"use client";

import { useCallback, useState } from "react";

/**
 * Hook providing a login redirect handler with immediate loading state feedback.
 */
export function useLoginRedirect() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsLoggingIn(true);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  return { isLoggingIn, login };
}

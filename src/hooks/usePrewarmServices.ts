"use client";

import { useEffect, useRef } from "react";
import { API_BASE_URL, OAUTH_BASE_URL } from "@/lib/api-config";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_POLLS = 4; // Maximum of 4 polls

/**
 * Silently pings the main Cognito API and OAuth backend health endpoints
 * during browser idle time and periodically every 10 minutes (max 4 times)
 * to keep instances warm and eliminate cold starts for users.
 */
export function usePrewarmServices() {
  const pollCountRef = useRef(0);

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return;

    let intervalId: NodeJS.Timeout | null = null;
    let initialTimerId: NodeJS.Timeout | null = null;
    let idleHandle: number | null = null;

    const prewarm = () => {
      if (pollCountRef.current >= MAX_POLLS) {
        if (intervalId) clearInterval(intervalId);
        return;
      }

      pollCountRef.current += 1;

      const endpoints: string[] = [];

      if (API_BASE_URL) {
        endpoints.push(`${API_BASE_URL}/health`);
      }

      if (OAUTH_BASE_URL) {
        endpoints.push(`${OAUTH_BASE_URL}/health`);
      }

      endpoints.forEach((url) => {
        // Silent fire-and-forget fetch with mode: 'no-cors' so cross-origin requests
        // still deliver to the server and wake up cold instances without CORS blocking
        fetch(url, {
          method: "GET",
          mode: "no-cors",
          cache: "no-store",
          credentials: "omit",
        }).catch(() => {
          // Fail silently without console noise
        });
      });

      // Stop recurring polling once max threshold is reached
      if (pollCountRef.current >= MAX_POLLS && intervalId) {
        clearInterval(intervalId);
      }
    };

    const startPolling = () => {
      // 1. Initial pre-warm ping
      prewarm();

      // 2. Schedule recurring ping every 10 minutes (up to max 4 times)
      intervalId = setInterval(() => {
        prewarm();
      }, POLL_INTERVAL_MS);
    };

    // Schedule initial run during browser idle time or fallback timer to never compete with LCP
    if ("requestIdleCallback" in window) {
      idleHandle = (
        window as unknown as {
          requestIdleCallback: (
            cb: () => void,
            opts: { timeout: number },
          ) => number;
        }
      ).requestIdleCallback(startPolling, { timeout: 3000 });
    } else {
      initialTimerId = setTimeout(startPolling, 1500);
    }

    return () => {
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        (
          window as unknown as { cancelIdleCallback: (id: number) => void }
        ).cancelIdleCallback(idleHandle);
      }
      if (initialTimerId) clearTimeout(initialTimerId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}

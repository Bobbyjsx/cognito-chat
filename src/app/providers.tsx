"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import type React from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";

// Devtools only in development — never in production bundle usage path
const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@tanstack/react-query-devtools").then(
            (m) => m.ReactQueryDevtools,
          ),
        { ssr: false },
      )
    : () => null;

import { useState, useEffect } from "react";
import { SessionExpiredDialog } from "@/components/modules/auth/SessionExpiredDialog";

let isRedirecting = false;
let setGlobalSessionExpired: ((expired: boolean) => void) | null = null;

const handleUnauthorized = () => {
  if (isRedirecting) return;
  isRedirecting = true;

  if (setGlobalSessionExpired) {
    setGlobalSessionExpired(true);
  } else {
    signOut({ redirect: false }).finally(() => {
      toast.error("Your session has expired. Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    });
  }
};

function getErrorMessage(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return undefined;
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    return Number((error as { status: unknown }).status);
  }
  return undefined;
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error: unknown) => {
        if (getErrorMessage(error) === "Unauthorized" || getErrorStatus(error) === 401) {
          handleUnauthorized();
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: unknown) => {
        if (getErrorMessage(error) === "Unauthorized" || getErrorStatus(error) === 401) {
          handleUnauthorized();
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error: unknown) => {
          if (getErrorMessage(error) === "Unauthorized" || getErrorStatus(error) === 401) return false;
          if (getErrorStatus(error) === 404) return false;
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setGlobalSessionExpired = setSessionExpired;
    return () => {
      setGlobalSessionExpired = null;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delay={200}>
        {children}
        <SessionExpiredDialog isOpen={sessionExpired} />
        <ReactQueryDevtools initialIsOpen={false} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

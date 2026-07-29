"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type React from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

let isRedirecting = false;

const handleUnauthorized = () => {
  if (isRedirecting) return;
  isRedirecting = true;

  signOut({ redirect: false }).finally(() => {
    toast.error("Your session has expired. Redirecting to login...");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  });
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
        if (getErrorMessage(error) === "Unauthorized") {
          handleUnauthorized();
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: unknown) => {
        if (getErrorMessage(error) === "Unauthorized") {
          handleUnauthorized();
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error: unknown) => {
          if (getErrorMessage(error) === "Unauthorized") return false;
          if (getErrorStatus(error) === 404) return false;
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: (_failureCount, error: unknown) => {
          if (getErrorMessage(error) === "Unauthorized") return false;
          return false;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

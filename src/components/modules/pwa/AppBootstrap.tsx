"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { fetchProfile, profileQueryKey } from "@/hooks/data/useAuth/useAuth";
import {
  fetchChatSessions,
  sessionsQueryKey,
} from "@/hooks/data/useChats/useChats";
import {
  fetchAppConfig,
  appConfigQueryKey,
} from "@/hooks/data/useConfig/useConfig";
import { markStartupReady } from "./startup-ready";

const APP_ROUTE_PREFIXES = ["/chat", "/library", "/settings"];

function isAppRoute(pathname: string) {
  return APP_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function AppBootstrap() {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAppRoute(pathname)) {
      markStartupReady();
      return;
    }

    let cancelled = false;

    void Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: appConfigQueryKey,
        queryFn: fetchAppConfig,
      }),
      queryClient.prefetchQuery({
        queryKey: profileQueryKey,
        queryFn: fetchProfile,
      }),
      queryClient.prefetchInfiniteQuery({
        queryKey: sessionsQueryKey(""),
        queryFn: ({ pageParam }) =>
          fetchChatSessions({
            pageParam: Number(pageParam) || 0,
            searchQuery: "",
          }),
        initialPageParam: 0,
      }),
    ]).finally(() => {
      if (!cancelled) markStartupReady();
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, queryClient]);

  return null;
}

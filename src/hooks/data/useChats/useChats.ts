import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  api,
  registerActiveSession,
  unregisterActiveSession,
} from "@/lib/axios";
import type {
  ChatSessionListItem,
  PaginatedResponse,
  SessionWithPaginatedMessages,
} from "@/types";

export const sessionsQueryKey = (searchQuery = "") =>
  ["chat-sessions", searchQuery] as const;

export async function fetchChatSessions({
  pageParam = 0,
  searchQuery = "",
  limit = 15,
}: {
  pageParam?: number;
  searchQuery?: string;
  limit?: number;
}) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: pageParam.toString(),
  });
  if (searchQuery.trim()) {
    params.append("q", searchQuery.trim());
  }
  const { data } = await api.get<PaginatedResponse<ChatSessionListItem>>(
    `/agent/sessions?${params.toString()}`,
  );
  return data;
}

// In-memory tracker for recently dispatched generations that may not yet be confirmed in cache
let pendingGenerationsCount = 0;
let pendingGenerationUntil = 0;

export function registerPendingGeneration(_sessionId?: string | null) {
  pendingGenerationsCount++;
  // Keep polling active for up to 15 seconds after a message was sent,
  // guaranteeing that the client discovers the queued background generation
  // even if the user navigates away or switches tabs immediately.
  pendingGenerationUntil = Math.max(
    pendingGenerationUntil,
    Date.now() + 15_000,
  );
}

export function clearPendingGeneration() {
  pendingGenerationsCount = Math.max(0, pendingGenerationsCount - 1);
  if (pendingGenerationsCount === 0) {
    pendingGenerationUntil = 0;
  }
}

export function resetAllPendingGenerations() {
  pendingGenerationsCount = 0;
  pendingGenerationUntil = 0;
}

export function isPendingGenerationActive(): boolean {
  if (pendingGenerationsCount <= 0) return false;
  if (Date.now() >= pendingGenerationUntil) {
    // Window expired: auto-drain stale counter
    pendingGenerationsCount = 0;
    pendingGenerationUntil = 0;
    return false;
  }
  return true;
}

export function useGetSessions(searchQuery?: string, limit: number = 15) {
  const normalizedQuery = searchQuery || "";

  return useInfiniteQuery({
    queryKey: sessionsQueryKey(normalizedQuery),
    queryFn: ({ pageParam = 0 }) =>
      fetchChatSessions({
        pageParam: Number(pageParam) || 0,
        searchQuery: normalizedQuery,
        limit,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined,
    initialPageParam: 0,
    // Short stale time so invalidateQueries triggers an immediate re-fetch
    staleTime: 10 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    // Continue polling when window/tab is in the background so push notifications can trigger
    refetchIntervalInBackground: true,
    // Poll when there is at least one active background generation in progress
    // OR when a generation was recently dispatched (< 15s ago).
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasActive = Boolean(
        data?.pages?.some((page) =>
          page.items?.some((s) => Boolean(s.activeGenerationId)),
        ),
      );
      if (isPendingGenerationActive()) {
        return 2500;
      }
      if (hasActive) {
        // Backoff for active background generations: 2.5s -> 5s -> 10s max
        const pollCount = query.state.dataUpdateCount ?? 0;
        if (pollCount <= 6) return 2500;
        if (pollCount <= 15) return 5000;
        if (pollCount <= 30) return 10000;
        // Stop polling after 30 polls (~3.5 minutes) to protect against permanently stuck generations
        return false;
      }
      return false;
    },
  });
}

export function useGetSession(sessionId: string | null, limit: number = 50) {
  const queryClient = useQueryClient();

  return useInfiniteQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get<SessionWithPaginatedMessages>(
        `/agent/sessions/${sessionId}?limit=${limit}&offset=${pageParam}`,
      );

      // Safely update active session read status in cached lists without blowing away search query results
      queryClient.setQueriesData<{
        pages: PaginatedResponse<ChatSessionListItem>[];
        pageParams: number[];
      }>({ queryKey: ["chat-sessions"] }, (old) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((s) =>
              s.id === sessionId ? { ...s, readStatus: "read" } : s,
            ),
          })),
        };
      });
      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage?.messages?.hasMore
        ? lastPage.messages.offset + lastPage.messages.limit
        : undefined,
    initialPageParam: 0,
    enabled: Boolean(sessionId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.delete<{ message: string }>(
        `/agent/sessions/${sessionId}`,
      );
      return data;
    },
    onSuccess: (_, deletedSessionId) => {
      queryClient.setQueriesData<{
        pages: PaginatedResponse<ChatSessionListItem>[];
        pageParams: number[];
      }>({ queryKey: ["chat-sessions"] }, (old) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((s) => s.id !== deletedSessionId),
          })),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });
}

export function useMarkSessionRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.patch(`/agent/sessions/${sessionId}/read`);
      return data;
    },
    onMutate: async (sessionId) => {
      // Optimistically update the UI
      await queryClient.cancelQueries({ queryKey: ["chat-sessions"] });
      const previousSessions = queryClient.getQueryData(["chat-sessions"]);

      queryClient.setQueriesData<{
        pages: PaginatedResponse<ChatSessionListItem>[];
        pageParams: number[];
      }>({ queryKey: ["chat-sessions"] }, (old) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((s) =>
              s.id === sessionId ? { ...s, readStatus: "read" } : s,
            ),
          })),
        };
      });

      return { previousSessions };
    },
    onError: (err, sessionId, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(["chat-sessions"], context.previousSessions);
      }
    },
  });
}

import { useEffect } from "react";

/**
 * Calculates polling interval for active generation status:
 * - Terminal states (completed, failed, cancelled): returns false to stop polling.
 * - Initial 7 polls (approx 14-22s): fixed 2000ms interval.
 * - After 7 polls: exponential backoff (3s -> 4.5s -> 6.75s -> 10s max).
 */
export function getGenerationPollInterval(query: {
  state?: {
    data?: any;
    dataUpdateCount?: number;
  };
}): number | false {
  const data = query.state?.data;
  if (
    data &&
    (data.status === "completed" ||
      data.status === "failed" ||
      data.status === "cancelled")
  ) {
    return false;
  }

  const pollCount = query.state?.dataUpdateCount ?? 0;
  if (pollCount <= 7) {
    return 2000;
  }

  const backoff = Math.pow(1.5, pollCount - 7);
  return Math.min(Math.round(2000 * backoff), 10000);
}

export function useActiveGeneration(
  generationId: string | null | undefined,
  sessionId: string | null,
) {
  const queryClient = useQueryClient();

  // Keep session registered as active for cache busting while generating
  useEffect(() => {
    if (sessionId && generationId) {
      registerActiveSession(sessionId);
    }
    return () => {
      if (sessionId) unregisterActiveSession(sessionId);
    };
  }, [sessionId, generationId]);

  const query = useQuery({
    queryKey: ["generation", generationId],
    queryFn: async () => {
      if (!generationId) return null;
      const { data } = await api.get(`/agent/generations/${generationId}`);
      return data;
    },
    enabled: Boolean(generationId),
    refetchInterval: (q) => getGenerationPollInterval(q),
  });

  useEffect(() => {
    if (
      query.data &&
      (query.data.status === "completed" ||
        query.data.status === "failed" ||
        query.data.status === "cancelled")
    ) {
      if (sessionId) {
        unregisterActiveSession(sessionId);
        queryClient.invalidateQueries({
          queryKey: ["chat-session", sessionId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    }
  }, [query.data?.status, sessionId, queryClient]);

  return query;
}

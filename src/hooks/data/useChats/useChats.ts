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
    // Poll ONLY when there is at least one active background generation in progress.
    // If no session has activeGenerationId, polling is completely disabled (false).
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data?.pages) return false;
      const hasActive = data.pages.some((page) =>
        page.items?.some((s) => Boolean(s.activeGenerationId)),
      );
      return hasActive ? 3000 : false;
    },
  });
}

export function useGetSession(sessionId: string | null, limit: number = 10) {
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

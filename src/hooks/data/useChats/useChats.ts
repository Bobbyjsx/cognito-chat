import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { api } from "@/lib/axios";
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
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
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
      const { data } = await api.post(`/agent/sessions/${sessionId}/read`);
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

export function useActiveGeneration(
  generationId: string | null | undefined,
  sessionId: string | null,
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["generation", generationId],
    queryFn: async () => {
      if (!generationId) return null;
      const { data } = await api.get(`/agent/generations/${generationId}`);
      return data;
    },
    enabled: Boolean(generationId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (
        data &&
        (data.status === "completed" ||
          data.status === "failed" ||
          data.status === "cancelled")
      ) {
        return false;
      }
      return 2000;
    },
  });

  useEffect(() => {
    if (
      query.data &&
      (query.data.status === "completed" ||
        query.data.status === "failed" ||
        query.data.status === "cancelled")
    ) {
      if (sessionId) {
        queryClient.invalidateQueries({
          queryKey: ["chat-session", sessionId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    }
  }, [query.data?.status, sessionId, queryClient]);

  return query;
}

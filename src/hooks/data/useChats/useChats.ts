import {
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

export function useGetSessions(searchQuery?: string, limit: number = 15) {
  return useInfiniteQuery({
    queryKey: ["chat-sessions", searchQuery || ""],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: pageParam.toString(),
      });
      if (searchQuery?.trim()) {
        params.append("q", searchQuery.trim());
      }
      const { data } = await api.get<PaginatedResponse<ChatSessionListItem>>(
        `/agent/sessions?${params.toString()}`,
      );
      return data;
    },
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

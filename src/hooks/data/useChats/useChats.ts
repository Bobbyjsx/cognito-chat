import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { ChatSession, ChatSessionListItem } from "@/types";

export function useGetSessions(searchQuery?: string) {
  return useQuery({
    queryKey: ["chat-sessions", searchQuery || ""],
    queryFn: async () => {
      const qParam = searchQuery?.trim()
        ? `?q=${encodeURIComponent(searchQuery.trim())}`
        : "";
      const { data } = await api.get<ChatSessionListItem[]>(
        `/agent/sessions${qParam}`,
      );
      return data;
    },
    staleTime: 60 * 1000, // 1 minute stale time for session lists
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useGetSession(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: async () => {
      const { data } = await api.get<ChatSession>(
        `/agent/sessions/${sessionId}`,
      );

      // Safely update active session read status in cached lists without blowing away search query results
      queryClient.setQueriesData<ChatSessionListItem[]>(
        { queryKey: ["chat-sessions"] },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((s) =>
            s.id === sessionId ? { ...s, readStatus: "read" } : s,
          );
        },
      );
      return data;
    },
    enabled: Boolean(sessionId),
    staleTime: 5 * 60 * 1000, // 5 minutes stale time for loaded sessions
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
      queryClient.setQueriesData<ChatSessionListItem[]>(
        { queryKey: ["chat-sessions"] },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.filter((s) => s.id !== deletedSessionId);
        },
      );
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });
}

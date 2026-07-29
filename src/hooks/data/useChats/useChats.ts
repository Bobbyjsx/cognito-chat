import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSessionsAction,
  getSessionAction,
  deleteSessionAction,
} from "@/lib/actions/chats";
import { isServerError } from "@/lib/server-error";
import type { ChatSessionListItem } from "@/types";

export function useGetSessions(searchQuery?: string) {
  return useQuery({
    queryKey: ["chat-sessions", searchQuery || ""],
    queryFn: async () => {
      const res = await getSessionsAction(searchQuery);
      if (isServerError(res)) {
        throw res;
      }
      return res;
    },
    staleTime: 15 * 1000,
  });
}

export function useGetSession(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: async () => {
      const res = await getSessionAction(sessionId!);
      if (isServerError(res)) {
        throw res;
      }
      // Safely update active session read status in cached lists without blowing away search query results
      queryClient.setQueriesData<ChatSessionListItem[]>(
        { queryKey: ["chat-sessions"] },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((s) => (s.id === sessionId ? { ...s, readStatus: "read" } : s));
        },
      );
      return res;
    },
    enabled: Boolean(sessionId),
    staleTime: 15 * 1000,
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await deleteSessionAction(sessionId);
      if (isServerError(res)) {
        throw res;
      }
      return res;
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

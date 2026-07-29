import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionsAction, getSessionAction } from "@/lib/actions/chats";
import { isServerError } from "@/lib/server-error";
import type { ChatSessionListItem } from "@/types";

export function useGetSessions() {
  return useQuery({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const res = await getSessionsAction();
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
      // Optimistically update sessions list in cache to mark as read
      queryClient.setQueryData<ChatSessionListItem[]>(["chat-sessions"], (old) => {
        if (!old) return old;
        return old.map((s) => (s.id === sessionId ? { ...s, readStatus: "read" } : s));
      });
      return res;
    },
    enabled: Boolean(sessionId),
    staleTime: 15 * 1000,
  });
}

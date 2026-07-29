import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sendChatMessageAction,
  getSessionsAction,
  getSessionAction,
} from "@/lib/actions/chats";

export function useGetSessions() {
  return useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => getSessionsAction(),
    staleTime: 15 * 1000,
  });
}

export function useGetSession(sessionId: string | null) {
  return useQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: () => getSessionAction(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 15 * 1000,
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      message,
      sessionId,
      model,
      reasoning,
    }: {
      message: string;
      sessionId?: string;
      model?: string;
      reasoning?: string;
    }) => sendChatMessageAction(message, sessionId, model, reasoning),
    onSuccess: (data) => {
      // Invalidate sessions list and specific session details
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (data?.sessionId) {
        queryClient.invalidateQueries({ queryKey: ["chat-session", data.sessionId] });
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

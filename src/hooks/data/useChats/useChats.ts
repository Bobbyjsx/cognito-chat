import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sendChatMessageAction,
  getSessionsAction,
  getSessionAction,
} from "@/lib/actions/chats";
import { isServerError } from "@/lib/server-error";

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
  return useQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: async () => {
      const res = await getSessionAction(sessionId!);
      if (isServerError(res)) {
        throw res;
      }
      return res;
    },
    enabled: Boolean(sessionId),
    staleTime: 15 * 1000,
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      message,
      sessionId,
      model,
      reasoning,
    }: {
      message: string;
      sessionId?: string;
      model?: string;
      reasoning?: string;
    }) => {
      const res = await sendChatMessageAction(message, sessionId, model, reasoning);
      if (isServerError(res)) {
        throw res;
      }
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (data?.sessionId) {
        queryClient.invalidateQueries({ queryKey: ["chat-session", data.sessionId] });
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

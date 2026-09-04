import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  SharedChat,
  CreateSharedChatResponse,
  ContinueChatResponse,
  ChatSessionListItem,
  PaginatedResponse,
  SessionWithPaginatedMessages,
} from "@/types";

export const sharedChatQueryKey = (shareId: string) =>
  ["shared-chat", shareId] as const;

export async function fetchSharedChat(shareId: string): Promise<SharedChat> {
  const { data } = await api.get<SharedChat>(`/agent/shared/${shareId}`);
  return data;
}

export function useGetSharedChat(shareId: string) {
  return useQuery({
    queryKey: sharedChatQueryKey(shareId),
    queryFn: () => fetchSharedChat(shareId),
    enabled: Boolean(shareId),
    staleTime: 5 * 60 * 1000,
  });
}

export const sessionShareQueryKey = (sessionId: string) =>
  ["session-share", sessionId] as const;

/** Keep session list/detail caches in sync with the active share id. */
function setSessionShareId(
  queryClient: QueryClient,
  sessionId: string,
  shareId: string | null,
) {
  queryClient.setQueriesData<{
    pages: PaginatedResponse<ChatSessionListItem>[];
    pageParams: number[];
  }>({ queryKey: ["chat-sessions"] }, (old) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((s) =>
          s.id === sessionId ? { ...s, shareId } : s,
        ),
      })),
    };
  });

  queryClient.setQueriesData<InfiniteData<SessionWithPaginatedMessages>>(
    { queryKey: ["chat-session", sessionId] },
    (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page, index) =>
          index === 0
            ? { ...page, session: { ...page.session, shareId } }
            : page,
        ),
      };
    },
  );
}

function clearShareIdFromSessions(queryClient: QueryClient, shareId: string) {
  queryClient.setQueriesData<{
    pages: PaginatedResponse<ChatSessionListItem>[];
    pageParams: number[];
  }>({ queryKey: ["chat-sessions"] }, (old) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((s) =>
          s.shareId === shareId ? { ...s, shareId: null } : s,
        ),
      })),
    };
  });

  queryClient.setQueriesData<InfiniteData<SessionWithPaginatedMessages>>(
    { queryKey: ["chat-session"] },
    (old) => {
      if (!old?.pages) return old;
      const session = old.pages[0]?.session;
      if (!session || session.shareId !== shareId) return old;
      return {
        ...old,
        pages: old.pages.map((page, index) =>
          index === 0
            ? { ...page, session: { ...page.session, shareId: null } }
            : page,
        ),
      };
    },
  );
}

export async function fetchSessionShare(
  sessionId: string,
): Promise<CreateSharedChatResponse | null> {
  try {
    const { data } = await api.get<CreateSharedChatResponse>(
      `/agent/sessions/${sessionId}/share`,
    );
    return data;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw err;
  }
}

export function useGetSessionShare(
  sessionId: string | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: sessionShareQueryKey(sessionId ?? ""),
    queryFn: () =>
      sessionId ? fetchSessionShare(sessionId) : Promise.resolve(null),
    enabled: Boolean(enabled && sessionId),
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useCreateSharedChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      title,
      showName = true,
    }: {
      sessionId: string;
      title?: string | null;
      showName?: boolean;
    }) => {
      const { data } = await api.post<CreateSharedChatResponse>(
        `/agent/sessions/${sessionId}/share`,
        { title, show_name: showName },
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(sessionShareQueryKey(data.sessionId), data);
      setSessionShareId(queryClient, data.sessionId, data.shareId);
      queryClient.invalidateQueries({
        queryKey: sharedChatQueryKey(data.shareId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionShareQueryKey(data.sessionId),
      });
    },
  });
}

export function useRevokeSharedChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shareId: string) => {
      const { data } = await api.delete<{ message: string; share_id: string }>(
        `/agent/shared/${shareId}`,
      );
      return data;
    },
    onSuccess: (_, shareId) => {
      clearShareIdFromSessions(queryClient, shareId);
      queryClient.invalidateQueries({
        queryKey: sharedChatQueryKey(shareId),
      });
      queryClient.invalidateQueries({
        queryKey: ["session-share"],
      });
    },
  });
}

export function useRevokeSessionShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.delete<{ message: string }>(
        `/agent/sessions/${sessionId}/share`,
      );
      return data;
    },
    onSuccess: (_, sessionId) => {
      queryClient.setQueryData(sessionShareQueryKey(sessionId), null);
      setSessionShareId(queryClient, sessionId, null);
      queryClient.invalidateQueries({
        queryKey: ["shared-chat"],
      });
      queryClient.invalidateQueries({
        queryKey: sessionShareQueryKey(sessionId),
      });
    },
  });
}

export function useContinueSharedChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shareId: string) => {
      const { data } = await api.post<ContinueChatResponse>(
        `/agent/shared/${shareId}/continue`,
      );
      return data;
    },
    onSuccess: (data) => {
      // Optimistically insert into sessions cache so the sidebar updates immediately
      queryClient.setQueriesData<{
        pages: PaginatedResponse<ChatSessionListItem>[];
        pageParams: number[];
      }>({ queryKey: ["chat-sessions"] }, (old) => {
        if (!old?.pages) return old;

        const newSessionItem: ChatSessionListItem = {
          id: data.sessionId,
          userId: "",
          title: data.title || "Continued Chat",
          excludeFromMemory: data.excludeFromMemory ?? true,
          readStatus: "read",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const [firstPage, ...rest] = old.pages;
        return {
          ...old,
          pages: [
            {
              ...firstPage,
              items: [
                newSessionItem,
                ...(firstPage?.items?.filter((s) => s.id !== data.sessionId) ??
                  []),
              ],
            },
            ...rest,
          ],
        };
      });

      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      queryClient.refetchQueries({ queryKey: ["chat-sessions"] });
    },
  });
}

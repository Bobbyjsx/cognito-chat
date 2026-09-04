"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage, type FileUIPart } from "ai";
import {
  useGetSession,
  useGetSessions,
  useActiveGeneration,
  registerPendingGeneration,
  clearPendingGeneration,
} from "@/hooks/data/useChats/useChats";
import { useGetSessionAttachments } from "@/hooks/data/useAttachments/useAttachments";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import { attachmentById } from "@/lib/attachments";
import {
  markGlobalMutation,
  registerActiveSession,
  unregisterActiveSession,
} from "@/lib/axios";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { notifyServerError } from "@/lib/server-error";
import {
  isWindowAway,
  showBrowserPushNotification,
  truncateNotificationBody,
} from "@/lib/push-notifications";
import type {
  MessageSchema,
  PaginatedResponse,
  ChatSessionListItem,
} from "@/types";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";
import { ChatSidebar } from "./ChatSidebar";
import { Navbar } from "./Navbar";
import { ArtifactCanvas } from "./ArtifactCanvas";
import { useArtifactStore } from "@/hooks/useArtifactStore";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSearchTool, extractSearchData } from "@/components/ai-elements/tool";

function toAssistantRole(role: string): "user" | "assistant" {
  if (role === "user") return "user";
  return "assistant";
}

function extractUIMessageText(msg?: UIMessage): string {
  if (!msg) return "";
  const legacy = (msg as unknown as Record<string, unknown>).content;
  if (typeof legacy === "string" && legacy.trim()) return legacy.trim();

  return (msg.parts ?? [])
    .filter(
      (p) =>
        p.type === "text" && typeof (p as { text?: string }).text === "string",
    )
    .map((p) => (p as { text: string }).text)
    .join("\n")
    .trim();
}

function ResizableCanvasPanel() {
  const { artifact } = useArtifactStore();
  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window !== "undefined") {
      return Math.min(Math.max(window.innerWidth * 0.45, 380), 720);
    }
    return 520;
  });
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow resizing on desktop viewports
    if (typeof window !== "undefined" && window.innerWidth < 768) return;

    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = window.innerWidth - moveEvent.clientX;
      const minWidth = 360;
      const maxWidth = Math.max(
        360,
        Math.min(window.innerWidth - 380, window.innerWidth * 0.75),
      );
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div
      className={cn(
        "overflow-hidden bg-[#1e1e2e] transition-none",
        // Mobile: full width positioned below the top navbar (h-14 = 56px), never overlapping header
        "absolute inset-x-0 top-14 bottom-0 z-30 flex w-full flex-col pb-[env(safe-area-inset-bottom)]",
        // Desktop: side-by-side resizable panel
        "md:relative md:inset-x-auto md:top-0 md:bottom-auto md:h-full md:w-[var(--canvas-width)] md:max-w-[min(850px,calc(100vw-380px))] md:min-w-[360px] md:shrink-0 md:border-l md:border-[#313244] md:pb-0",
      )}
      style={
        {
          "--canvas-width": `${panelWidth}px`,
        } as React.CSSProperties
      }
    >
      {/* Resizer Handle (Desktop only) */}
      <div
        onMouseDown={handleMouseDown}
        className="group/resizer absolute top-0 bottom-0 -left-1.5 z-30 hidden w-3 cursor-col-resize items-center justify-center transition-colors hover:bg-white/10 md:flex"
        title="Drag to resize canvas"
      >
        <div className="z-10 flex h-8 w-1 items-center justify-center rounded-full bg-[#313244] transition-colors group-hover/resizer:bg-[#cba6f7]">
          <GripVertical className="h-3 w-3 text-[#6c7086] opacity-0 group-hover/resizer:opacity-100" />
        </div>
      </div>

      <ArtifactCanvas key={artifact?.id} />
    </div>
  );
}

function sessionIdFromParams(
  params: ReturnType<typeof useParams>,
): string | null {
  const raw = (params as Record<string, string | string[] | undefined>)
    ?.sessionId;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return null;
}

export function ChatShell() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const queryClient = useQueryClient();
  const { data: config } = useGetConfig();

  const routeSessionId = sessionIdFromParams(params);
  const isNewChatRoute = pathname === "/chat" || pathname === "/chat/";

  const [userSelectedModel, setUserSelectedModel] = useState<string | null>(
    null,
  );
  const [userSelectedReasoning, setUserSelectedReasoning] = useState<
    string | null
  >(null);
  const [streamSessionId, setStreamSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydratedSessionId, setHydratedSessionId] = useState<string | null>(
    null,
  );
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const streamedSessionRef = useRef<string | null>(null);
  // Holds metadata for attachments sent in the current message so the
  // optimistic chip renders with the correct contentType immediately.
  const pendingAttachmentMetaRef = useRef<
    Record<string, { mimeType: string; filename: string }>
  >({});
  const hasSentAttachmentsRef = useRef(false);
  const lastHydratedKeyRef = useRef<string>("");

  const activeSessionId = routeSessionId ?? streamSessionId ?? pendingSessionId;

  const defaultModel = config?.defaultTextModel || "gemini-3.6-flash";
  const defaultReasoning = config?.defaultReasoningLevel || "medium";

  const activeModel = userSelectedModel || defaultModel;
  const activeReasoning = userSelectedReasoning || defaultReasoning;

  // Use refs to avoid stale closures in useChat callbacks
  const currentModelRef = useRef(userSelectedModel);
  const currentReasoningRef = useRef(userSelectedReasoning);

  // Track whether the page is currently unloading/reloading to silently suppress all stream disconnect errors
  const isUnloadingRef = useRef(false);

  useEffect(() => {
    currentModelRef.current = userSelectedModel;
    currentReasoningRef.current = userSelectedReasoning;
  }, [userSelectedModel, userSelectedReasoning]);

  useEffect(() => {
    const handleUnload = () => {
      isUnloadingRef.current = true;
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, []);

  const {
    data: sessionPages,
    isLoading: isSessionLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetSession(routeSessionId);

  const { data: sessionsData } = useGetSessions();
  const sidebarSession = useMemo(() => {
    if (!routeSessionId) return null;
    return sessionsData?.pages
      ?.flatMap((p) => p?.items || [])
      ?.find((s) => s && s.id === routeSessionId);
  }, [sessionsData, routeSessionId]);

  const activeGenerationId = routeSessionId
    ? sessionPages?.pages[0]?.activeGenerationId ||
      sidebarSession?.activeGenerationId
    : null;
  const { data: activeGenData } = useActiveGeneration(
    activeGenerationId,
    routeSessionId,
  );

  // Preserve the last terminal (failed/cancelled) generation data so the
  // user prompt + error survive after activeGenerationId is cleared from the
  // session by the backend.  This handles the reload-during-generation race
  // where the session re-fetch clears activeGenerationId before the session
  // messages include the failed turn.
  const [lastTerminalGen, setLastTerminalGen] = useState<any>(null);
  useEffect(() => {
    if (
      activeGenData &&
      (activeGenData.status === "failed" ||
        activeGenData.status === "cancelled")
    ) {
      queueMicrotask(() => {
        setLastTerminalGen(activeGenData);
      });
    }
    // Clear when switching to a different session or new chat
    if (!routeSessionId) {
      queueMicrotask(() => {
        setLastTerminalGen(null);
      });
    }
  }, [activeGenData, routeSessionId]);

  // Use activeGenData when available, otherwise fall back to the preserved
  // terminal data for this session (only if on a routed session).
  const effectiveGenData = routeSessionId
    ? (activeGenData ?? lastTerminalGen)
    : null;

  const sessionData =
    sessionPages?.pages[0]?.session ||
    (sessionPages?.pages[0] as any)?.items?.[0];
  const allMessages = useMemo(
    () =>
      sessionPages?.pages.flatMap(
        (p) => p?.messages?.items || (p as any)?.items?.[0]?.messages || [],
      ) || [],
    [sessionPages],
  );

  const { data: sessionAttachments } = useGetSessionAttachments(
    config?.enableAttachments ? routeSessionId : null,
  );

  const {
    messages: aiMessages,
    setMessages: setAiMessages,
    sendMessage,
    stop,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onData: (dataPart) => {
      if (dataPart.type !== "data-session") return;
      const data = dataPart.data as {
        sessionId?: string;
        generationId?: string;
      };
      const nextId = data?.sessionId;
      if (!nextId) return;

      setStreamSessionId(nextId);
      setHydratedSessionId(nextId);
      streamedSessionRef.current = nextId;

      if (
        typeof window !== "undefined" &&
        (window.location.pathname === "/chat" ||
          window.location.pathname === "/chat/")
      ) {
        window.history.replaceState(null, "", `/chat/${nextId}`);
      }

      // Immediately stamp activeGenerationId into the sessions cache so the sidebar
      // spinner appears without waiting for the next poll.
      if (data.generationId) {
        clearPendingGeneration();
        const genId = data.generationId;
        registerActiveSession(nextId);
        queryClient.setQueriesData<{
          pages: PaginatedResponse<ChatSessionListItem>[];
          pageParams: number[];
        }>({ queryKey: ["chat-sessions"] }, (old) => {
          if (!old?.pages) return old;

          // Check if session already exists in any page
          const exists = old.pages.some((page) =>
            page.items?.some((s) => s.id === nextId),
          );

          if (exists) {
            // Update existing session entry
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items?.map((s) =>
                  s.id === nextId ? { ...s, activeGenerationId: genId } : s,
                ),
              })),
            };
          }

          // New session — prepend a minimal stub so the spinner shows immediately
          const stub: ChatSessionListItem = {
            id: nextId,
            userId: "",
            title: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            activeGenerationId: genId,
          };

          const [firstPage, ...rest] = old.pages;
          return {
            ...old,
            pages: [
              {
                ...firstPage,
                items: [stub, ...(firstPage?.items ?? [])],
              },
              ...rest,
            ],
          };
        });
      }
    },
    onFinish: ({ message, messages: finishMessages }) => {
      // Mark the global mutation in Axios so the subsequent profile fetch gets no-cache headers
      markGlobalMutation();

      const sid = streamedSessionRef.current;
      if (sid) {
        unregisterActiveSession(sid);
      }

      // Reflect the freshly streamed session in the URL now that the response
      // is committed to the DOM — we use history API to bypass Next.js
      // navigation completely, ensuring zero layout shifts or loading UI flashes.
      if (sid && !pathname.startsWith(`/chat/${sid}`)) {
        window.history.replaceState(null, "", `/chat/${sid}`);
      }
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["chat-session"] });

      if (hasSentAttachmentsRef.current) {
        queryClient.invalidateQueries({ queryKey: ["chat-attachments"] });
        hasSentAttachmentsRef.current = false;
      }

      // Reset so the hydration effect re-runs with fresh attachment data
      setHydratedSessionId(null);
      pendingAttachmentMetaRef.current = {};

      // If user switched away from window/tab while waiting, notify them
      if (isWindowAway()) {
        const targetSid = sid || routeSessionId || "";

        // Extract assistant response text
        const responseText =
          extractUIMessageText(message) ||
          extractUIMessageText(
            (finishMessages ?? [])
              .filter((m) => m.role === "assistant")
              .slice(-1)[0],
          ) ||
          extractUIMessageText(
            aiMessages.filter((m) => m.role === "assistant").slice(-1)[0],
          );

        const firstUserQuery =
          extractUIMessageText(
            (finishMessages ?? []).find((m) => m.role === "user"),
          ) || extractUIMessageText(aiMessages.find((m) => m.role === "user"));

        const sessionTitle =
          sessionData?.title ||
          (firstUserQuery ? firstUserQuery.slice(0, 40) : null) ||
          "Cognito Chat";

        void showBrowserPushNotification({
          title: sessionTitle,
          body: truncateNotificationBody(responseText),
          url: targetSid ? `/chat/${targetSid}` : "/chat",
          tag: `cognito-chat-${targetSid || "active"}`,
        });
      }
    },
    onError: (err) => {
      // If the page is reloading or unloading, suppress all errors silently
      if (isUnloadingRef.current) {
        return;
      }

      // Suppress abort/cancel/network/disconnect errors — these fire when
      // the user navigates away or reloads during an active stream, or when
      // the generation is sent to the background worker.
      const msg = (err as Error)?.message?.toLowerCase?.() ?? "";
      const name = (err as Error)?.name ?? "";

      if (
        (err instanceof DOMException && err.name === "AbortError") ||
        name === "AbortError" ||
        msg.includes("abort") ||
        msg.includes("cancel") ||
        msg.includes("network") ||
        msg.includes("fetch") ||
        msg.includes("failed to fetch") ||
        msg.includes("load failed") ||
        msg.includes("stream") ||
        msg.includes("connection") ||
        msg.includes("closed") ||
        msg.includes("premature") ||
        msg.includes("client disconnected")
      ) {
        return;
      }
      notifyServerError(err, "Streaming error occurred");
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const isSessionSwitchPending =
    pendingSessionId !== null && pendingSessionId !== routeSessionId;

  // Invalidate sessions list on unmount if streaming was aborted by navigation
  useEffect(() => {
    return () => {
      if (isStreaming) {
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      }
    };
  }, [isStreaming, queryClient]);

  const handleSelectModel = useCallback((model: string) => {
    setUserSelectedModel(model);
  }, []);

  const handleSelectReasoning = useCallback((reasoning: string) => {
    setUserSelectedReasoning(reasoning);
  }, []);

  const formattedAllMessages = useMemo<UIMessage[]>(() => {
    const rawList = allMessages.map((m: MessageSchema, idx: number) => {
      const experimental_attachments: any[] = [];

      for (const attachmentId of m.attachmentIds ?? []) {
        const attachment = attachmentById(sessionAttachments, attachmentId);
        if (!attachment) continue;
        experimental_attachments.push({
          contentType: attachment.mimeType,
          name: attachment.filename,
          url: `/agent/attachments/${attachment.id}/content`,
          size: attachment.size,
        });
      }

      const parts: UIMessage["parts"] = [];
      if (Array.isArray(m.parts) && m.parts.length > 0) {
        for (const p of m.parts) {
          if (p.type === "text" && typeof (p as any).text === "string") {
            parts.push({ type: "text", text: (p as any).text });
          } else if (p.type === "sources" || p.type === "source") {
            parts.push(p as any);
          } else if (p.type === "tool" || (p as any).type === "dynamic-tool") {
            // Do not persist/display tool calls across reloads.
            // If historical search tool output had sources, preserve only the sources.
            const toolName = (p as any).toolName || (p as any).tool_name || "";
            if (isSearchTool(toolName)) {
              const { sources } = extractSearchData(p as any);
              if (sources.length > 0) {
                parts.push({ type: "sources", sources } as any);
              }
            }
          }
          // Do NOT add thoughts / reasoning to parts across reloads
        }
      }

      if (parts.length === 0 && m.content.trim().length > 0) {
        parts.push({ type: "text", text: m.content });
      }

      return {
        id: m.id || `hist-${idx}`,
        role: toAssistantRole(m.role),
        content: m.content,
        parts,
        experimental_attachments,
        ...(m.error ? { error: m.error } : {}),
      } as any;
    });

    // Suppress historical errors on user messages if an assistant message with content follows
    for (let i = 0; i < rawList.length - 1; i++) {
      const msg = rawList[i];
      const next = rawList[i + 1];
      if (
        msg.role === "user" &&
        (msg as any).error &&
        next.role === "assistant" &&
        ((Array.isArray(next.parts) &&
          next.parts.some(
            (p: any) =>
              (p.type === "text" && p.text?.trim()) ||
              (p.type === "reasoning" && p.text?.trim()),
          )) ||
          (typeof (next as any).content === "string" &&
            (next as any).content.trim().length > 0))
      ) {
        delete (msg as any).error;
      }
    }

    return rawList;
  }, [allMessages, sessionAttachments]);

  // Hydrate from session history when navigating between existing sessions
  useEffect(() => {
    if (isStreaming) return;

    if (!routeSessionId) {
      if (!streamSessionId) {
        lastHydratedKeyRef.current = "";
        queueMicrotask(() => {
          setPendingSessionId(null);
          setStreamSessionId(null);
          setHydratedSessionId(null);
          setAiMessages([]);
        });
      }
      return;
    }

    if (sessionData && sessionData.id === routeSessionId) {
      // If this session was generated by the active stream in the current tab, keep live aiMessages intact
      if (streamSessionId === routeSessionId) {
        lastHydratedKeyRef.current = `${routeSessionId}:stream`;
        queueMicrotask(() => {
          setHydratedSessionId(routeSessionId);
          setPendingSessionId(null);
        });
        return;
      }

      const hydrationKey = `${routeSessionId}:${allMessages.length}:${allMessages[allMessages.length - 1]?.id ?? ""}`;
      if (lastHydratedKeyRef.current !== hydrationKey) {
        lastHydratedKeyRef.current = hydrationKey;

        queueMicrotask(() => {
          setAiMessages(formattedAllMessages);
          setHydratedSessionId(routeSessionId);
          setPendingSessionId(null);
        });
      }
    }
  }, [
    routeSessionId,
    sessionData,
    allMessages,
    formattedAllMessages,
    setAiMessages,
    isStreaming,
    isNewChatRoute,
    streamSessionId,
  ]);

  const handleSendMessage = useCallback(
    (
      text: string,
      model?: string,
      reasoning?: string,
      attachmentIds?: string[],
      files?: FileUIPart[],
      attachmentMeta?: Record<string, { mimeType: string; filename: string }>,
    ) => {
      if (attachmentMeta) {
        pendingAttachmentMetaRef.current = {
          ...pendingAttachmentMetaRef.current,
          ...attachmentMeta,
        };
      }

      // Build rich experimental_attachments for the optimistic message chip.
      // Prefer metadata we already have in sessionAttachments or pendingAttachmentMetaRef.
      const optimisticAttachments = (attachmentIds ?? []).map((id) => {
        const known =
          sessionAttachments?.find((a) => a.id === id) ??
          (pendingAttachmentMetaRef.current[id]
            ? {
                mimeType: pendingAttachmentMetaRef.current[id].mimeType,
                filename: pendingAttachmentMetaRef.current[id].filename,
                id,
              }
            : null);
        return {
          type: "file",
          url: `/agent/attachments/${id}/content`,
          name: known?.filename ?? `Attachment ${id}`,
          filename: known?.filename ?? `Attachment ${id}`,
          contentType: known?.mimeType,
          mediaType: known?.mimeType,
        };
      });

      const allFiles = [...(files || [])];
      for (const opt of optimisticAttachments) {
        // cast because optimisticAttachments uses mediaType which matches FileUIPart
        allFiles.push(opt as any);
      }

      if (allFiles.length > 0 || (attachmentIds && attachmentIds.length > 0)) {
        hasSentAttachmentsRef.current = true;
      }

      sendMessage(
        {
          text,
          ...(allFiles.length > 0 ? { files: allFiles } : {}),
        },
        {
          body: {
            model: model || activeModel,
            reasoning: reasoning || activeReasoning,
            sessionId: activeSessionId || undefined,
            ...(attachmentIds && attachmentIds.length > 0
              ? { attachments: attachmentIds }
              : {}),
          },
        },
      );

      registerPendingGeneration(activeSessionId);
      markGlobalMutation();

      // Invalidate the sessions list on a staggered timeline so the background
      // worker / queued generation is discovered even if the user leaves immediately.
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      }, 800);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      }, 2000);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      }, 4000);
    },
    [
      sendMessage,
      activeModel,
      activeReasoning,
      activeSessionId,
      sessionAttachments,
      queryClient,
    ],
  );

  const handleNewChat = useCallback(() => {
    if (isStreaming) {
      registerPendingGeneration(streamSessionId || routeSessionId);
      stop();
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    }
    setStreamSessionId(null);
    setHydratedSessionId(null);
    setPendingSessionId(null);
    streamedSessionRef.current = null;
    setLastTerminalGen(null);
    setUserSelectedModel(null);
    setUserSelectedReasoning(null);
    setAiMessages([]);
    lastHydratedKeyRef.current = "";
    if (pathname !== "/chat" && pathname !== "/chat/") {
      router.push("/chat");
    }
  }, [
    setAiMessages,
    isStreaming,
    stop,
    pathname,
    router,
    streamSessionId,
    routeSessionId,
    queryClient,
  ]);

  const handleSelectSession = useCallback(
    (id: string) => {
      if (id === routeSessionId) return;
      if (isStreaming) {
        registerPendingGeneration(streamSessionId || routeSessionId);
        stop();
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      }
      setStreamSessionId(null);
      setHydratedSessionId(null);
      setPendingSessionId(id);
      streamedSessionRef.current = null;
      setLastTerminalGen(null);
      router.push(`/chat/${id}`);
    },
    [routeSessionId, isStreaming, stop, router, streamSessionId, queryClient],
  );

  const streamingMessageId =
    isStreaming && aiMessages.length > 0
      ? aiMessages[aiMessages.length - 1]?.role === "assistant"
        ? aiMessages[aiMessages.length - 1].id
        : null
      : null;

  const showSessionLoading =
    !isStreaming &&
    !Boolean(activeGenerationId) &&
    (isSessionSwitchPending ||
      (Boolean(routeSessionId) &&
        routeSessionId !== streamSessionId &&
        (hydratedSessionId !== routeSessionId ||
          isSessionLoading ||
          !sessionData ||
          sessionData.id !== routeSessionId)));

  const displayMessages = useMemo(() => {
    const baseList = isStreaming
      ? aiMessages
      : aiMessages.length > 0
        ? aiMessages
        : formattedAllMessages;

    const list = [...baseList];

    const isGenActive =
      effectiveGenData &&
      effectiveGenData.status !== "completed" &&
      effectiveGenData.status !== "failed" &&
      effectiveGenData.status !== "cancelled";

    const isGenCompleted =
      effectiveGenData && effectiveGenData.status === "completed";

    // For failed generations with an explicit backend error (e.g. timeout),
    // inject the user prompt + error message so the user sees what happened.
    // Cancelled generations (SSE disconnect on reload) are treated as silent —
    // we only ensure the user prompt is visible, no error banner.
    const isGenFailed =
      effectiveGenData &&
      effectiveGenData.status === "failed" &&
      Boolean(effectiveGenData.error);

    const isGenCancelled =
      effectiveGenData && effectiveGenData.status === "cancelled";

    // Silent failure = backend marked as "failed" but provided no error detail,
    // likely because the SSE client disconnected. Treat like cancelled.
    const isGenSilentFailure =
      effectiveGenData &&
      effectiveGenData.status === "failed" &&
      !effectiveGenData.error;

    if (
      isGenActive ||
      isGenCompleted ||
      isGenFailed ||
      isGenCancelled ||
      isGenSilentFailure
    ) {
      const promptText = effectiveGenData.prompt;
      const userMsgId =
        effectiveGenData.userMessageId || effectiveGenData.user_message_id;

      // 1. Ensure the user prompt that triggered this generation is in the message list
      if (
        promptText &&
        !list.some(
          (m) =>
            m.role === "user" &&
            ((m as any).content === promptText ||
              (Boolean(userMsgId) && m.id === userMsgId)),
        )
      ) {
        list.push({
          id: (userMsgId as string) || `prompt-${effectiveGenData.id}`,
          role: "user",
          content: promptText,
          parts: [{ type: "text", text: promptText }],
          createdAt:
            effectiveGenData.createdAt || effectiveGenData.created_at
              ? new Date(
                  effectiveGenData.createdAt || effectiveGenData.created_at,
                )
              : new Date(),
        } as any);
      }

      // 2. For active, truly failed, or newly completed generations, inject the assistant placeholder/error.
      //    This keeps the generated text visible seamlessly until the refetched session messages arrive from DB.
      if (isGenActive || isGenFailed || isGenCompleted) {
        const hasAlreadyCommitted = list.some(
          (m) =>
            m.role === "assistant" &&
            (m.id === effectiveGenData.id ||
              m.id === effectiveGenData.messageId ||
              m.id === effectiveGenData.message_id ||
              (effectiveGenData.bufferedText &&
                (m as any).content === effectiveGenData.bufferedText)),
        );

        if (!hasAlreadyCommitted) {
          const parts: any[] = [];
          const thoughts =
            effectiveGenData.bufferedThoughts ||
            effectiveGenData.buffered_thoughts;
          const text =
            effectiveGenData.bufferedText || effectiveGenData.buffered_text;
          const created =
            effectiveGenData.createdAt || effectiveGenData.created_at;

          if (thoughts) {
            parts.push({
              type: "reasoning",
              text: thoughts,
            });
          }
          if (text) {
            parts.push({ type: "text", text });
          }

          list.push({
            id: effectiveGenData.id,
            role: "assistant",
            parts,
            isGenerating: isGenActive,
            ...(effectiveGenData.error
              ? { error: effectiveGenData.error }
              : {}),
            createdAt: created ? new Date(created) : new Date(),
          } as any);
        }
      }
    }

    // Post-process: suppress user message errors when the next message is a
    // successful assistant response with content.  This handles the case where
    // the backend streams a complete response but also emits a timeout/error
    // event — the error banner is misleading since the user got a valid answer.
    for (let i = 0; i < list.length - 1; i++) {
      const msg = list[i];
      const next = list[i + 1];
      if (
        msg.role === "user" &&
        (msg as any).error &&
        next.role === "assistant" &&
        ((Array.isArray(next.parts) &&
          next.parts.some(
            (p: any) =>
              (p.type === "text" && p.text?.trim()) ||
              (p.type === "reasoning" && p.text?.trim()),
          )) ||
          (typeof (next as any).content === "string" &&
            (next as any).content.trim().length > 0))
      ) {
        // Clone the message without the error property
        const { error: _stripped, ...rest } = msg as any;
        list[i] = rest as any;
      }
    }

    return list;
  }, [isStreaming, aiMessages, formattedAllMessages, effectiveGenData]);

  const { artifact, isOpen: isArtifactOpen } = useArtifactStore();
  const showArtifact = Boolean(isArtifactOpen && artifact);

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface flex h-full w-full overflow-hidden">
      <ChatSidebar
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        activeModel={activeModel}
        onSelectModel={handleSelectModel}
        activeReasoning={activeReasoning}
        onSelectReasoning={handleSelectReasoning}
      />

      <main className="bg-background relative flex h-full min-w-0 flex-1 flex-col">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          onNewChat={activeSessionId ? handleNewChat : undefined}
        />

        <ChatMessageList
          messages={displayMessages}
          isStreaming={isStreaming}
          hasActiveBackgroundGeneration={Boolean(activeGenerationId)}
          isSessionLoading={showSessionLoading}
          streamingMessageId={streamingMessageId}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          hasMultiplePages={Boolean(
            sessionPages?.pages && sessionPages.pages.length > 1,
          )}
          onSuggestionClick={(text) =>
            handleSendMessage(text, activeModel, activeReasoning)
          }
        />

        <ChatInput
          onSend={handleSendMessage}
          onStop={stop}
          status={status}
          selectedModel={activeModel}
          onSelectModel={handleSelectModel}
          selectedReasoning={activeReasoning}
          onSelectReasoning={handleSelectReasoning}
        />
      </main>

      {showArtifact && <ResizableCanvasPanel />}
    </div>
  );
}

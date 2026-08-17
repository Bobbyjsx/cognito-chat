"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage, type FileUIPart } from "ai";
import { useGetSession } from "@/hooks/data/useChats/useChats";
import { useGetSessionAttachments } from "@/hooks/data/useAttachments/useAttachments";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import { attachmentById } from "@/lib/attachments";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { notifyServerError } from "@/lib/server-error";
import type { MessageSchema } from "@/types";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";
import { ChatSidebar } from "./ChatSidebar";
import { Navbar } from "./Navbar";

function toAssistantRole(role: string): "user" | "assistant" {
  if (role === "user") return "user";
  return "assistant";
}

function sessionIdFromParams(
  params: ReturnType<typeof useParams>,
): string | null {
  const raw = params?.sessionId;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return null;
}

export function ChatShell() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
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

  const activeSessionId = routeSessionId ?? streamSessionId ?? pendingSessionId;
  const activeModel =
    userSelectedModel || config?.defaultTextModel || "gemini-3.6-flash";
  const activeReasoning =
    userSelectedReasoning || config?.defaultReasoningLevel || "medium";

  // Use refs to avoid stale closures in useChat callbacks
  const currentModelRef = useRef(userSelectedModel);
  const currentReasoningRef = useRef(userSelectedReasoning);

  useEffect(() => {
    currentModelRef.current = userSelectedModel;
    currentReasoningRef.current = userSelectedReasoning;
  }, [userSelectedModel, userSelectedReasoning]);

  const {
    data: sessionPages,
    isLoading: isSessionLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetSession(routeSessionId);

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
      const data = dataPart.data as { sessionId?: string };
      const nextId = data?.sessionId;
      if (!nextId) return;

      // Copy current settings to the new session
      try {
        const modelToSave = currentModelRef.current;
        const reasoningToSave = currentReasoningRef.current;
        if (modelToSave || reasoningToSave) {
          localStorage.setItem(
            `chat_settings_${nextId}`,
            JSON.stringify({
              model: modelToSave,
              reasoning: reasoningToSave,
            }),
          );
        }
      } catch {}

      setStreamSessionId(nextId);
      setHydratedSessionId(nextId);
      streamedSessionRef.current = nextId;
    },
    onFinish: () => {
      // Reflect the freshly streamed session in the URL now that the response
      // is committed to the DOM — we use history API to bypass Next.js
      // navigation completely, ensuring zero layout shifts or loading UI flashes.
      const sid = streamedSessionRef.current;
      if (sid && !pathname.startsWith(`/chat/${sid}`)) {
        window.history.replaceState(null, "", `/chat/${sid}`);
      }
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["chat-session"] });
      queryClient.invalidateQueries({ queryKey: ["chat-attachments"] });
      // Reset so the hydration effect re-runs with fresh attachment data
      setHydratedSessionId(null);
      pendingAttachmentMetaRef.current = {};
    },
    onError: (err) => {
      notifyServerError(err, "Streaming error occurred");
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const isSessionSwitchPending =
    pendingSessionId !== null && pendingSessionId !== routeSessionId;

  // Load from localStorage when activeSessionId or config changes
  useEffect(() => {
    if (!config || isStreaming) return;
    const storageKey = activeSessionId
      ? `chat_settings_${activeSessionId}`
      : "chat_settings_default";
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { model, reasoning } = JSON.parse(saved);

        queueMicrotask(() => {
          const modelsList = config.modelsList ?? {};
          const globalAllowedReasoning = config.allowedReasoningLevels;
          const allowedModels = Object.entries(modelsList)
            .filter(([, cfg]) => cfg.enabled)
            .map(([name]) => name);

          let validModel: string | null = null;
          if (model && allowedModels.includes(model)) {
            validModel = model;
            setUserSelectedModel(model);
          } else {
            setUserSelectedModel(null);
          }

          const modelToUse = validModel ?? config.defaultTextModel;
          const modelCfg = modelsList[modelToUse];
          const allowedReasoningForModel = modelCfg
            ? modelCfg.reasoningModes.filter((m) =>
                globalAllowedReasoning.includes(m),
              )
            : globalAllowedReasoning;

          if (
            reasoning &&
            globalAllowedReasoning.includes(reasoning) &&
            allowedReasoningForModel.includes(reasoning)
          ) {
            setUserSelectedReasoning(reasoning);
          } else {
            setUserSelectedReasoning(null);
          }
        });
      } else {
        queueMicrotask(() => {
          setUserSelectedModel(null);
          setUserSelectedReasoning(null);
        });
      }
    } catch (err) {
      console.error("Failed to parse saved chat settings", err);
    }
  }, [activeSessionId, config, isStreaming]);

  const handleSelectModel = useCallback(
    (model: string) => {
      setUserSelectedModel(model);
      const storageKey = activeSessionId
        ? `chat_settings_${activeSessionId}`
        : "chat_settings_default";
      try {
        const saved = localStorage.getItem(storageKey);
        const data = saved ? JSON.parse(saved) : {};
        localStorage.setItem(storageKey, JSON.stringify({ ...data, model }));
      } catch {}
    },
    [activeSessionId],
  );

  const handleSelectReasoning = useCallback(
    (reasoning: string) => {
      setUserSelectedReasoning(reasoning);
      const storageKey = activeSessionId
        ? `chat_settings_${activeSessionId}`
        : "chat_settings_default";
      try {
        const saved = localStorage.getItem(storageKey);
        const data = saved ? JSON.parse(saved) : {};
        localStorage.setItem(
          storageKey,
          JSON.stringify({ ...data, reasoning }),
        );
      } catch {}
    },
    [activeSessionId],
  );

  // Hydrate from session history when navigating between existing sessions
  useEffect(() => {
    if (isStreaming) return;

    if (!routeSessionId) {
      queueMicrotask(() => {
        setPendingSessionId(null);
      });

      if (isNewChatRoute && !streamSessionId) {
        queueMicrotask(() => {
          setHydratedSessionId(null);
          setAiMessages([]);
        });
      }
      return;
    }

    if (
      sessionData &&
      sessionData.id === routeSessionId &&
      sessionAttachments !== undefined
    ) {
      if (hydratedSessionId !== routeSessionId) {
        // If this session was generated by the active stream, keep live aiMessages intact
        if (streamSessionId === routeSessionId) {
          queueMicrotask(() => {
            setHydratedSessionId(routeSessionId);
            setPendingSessionId(null);
          });
          return;
        }

        const formatted: UIMessage[] = allMessages.map(
          (m: MessageSchema, idx: number) => {
            const experimental_attachments: any[] = [];

            // Historical attachments render as metadata-only chips (the backend
            // stores metadata, not content, for past messages).
            for (const attachmentId of m.attachmentIds ?? []) {
              const attachment = attachmentById(
                sessionAttachments,
                attachmentId,
              );
              if (!attachment) continue;
              experimental_attachments.push({
                contentType: attachment.mimeType,
                name: attachment.filename,
                url: `/agent/attachments/${attachment.id}/content`,
                size: attachment.size,
              });
            }

            const parts: UIMessage["parts"] = [];
            if (m.content.trim().length > 0) {
              parts.push({ type: "text", text: m.content });
            }

            return {
              id: m.id || `hist-${idx}`,
              role: toAssistantRole(m.role),
              content: m.content,
              parts,
              experimental_attachments,
            };
          },
        );
        queueMicrotask(() => {
          setAiMessages(formatted);
          setHydratedSessionId(routeSessionId);
          setPendingSessionId(null);
        });
      }
    }
  }, [
    routeSessionId,
    sessionData,
    allMessages,
    setAiMessages,
    hydratedSessionId,
    isStreaming,
    isNewChatRoute,
    streamSessionId,
    sessionAttachments,
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
    },
    [
      sendMessage,
      activeModel,
      activeReasoning,
      activeSessionId,
      sessionAttachments,
    ],
  );

  const handleNewChat = useCallback(() => {
    if (isStreaming) return;
    setStreamSessionId(null);
    setHydratedSessionId(null);
    setPendingSessionId(null);
    streamedSessionRef.current = null;
    setAiMessages([]);
  }, [setAiMessages, isStreaming]);

  const handleSelectSession = useCallback(
    (id: string) => {
      if (id === routeSessionId) return;
      if (isStreaming) return;
      setPendingSessionId(id);
    },
    [routeSessionId, isStreaming],
  );

  const streamingMessageId =
    isStreaming && aiMessages.length > 0
      ? aiMessages[aiMessages.length - 1]?.role === "assistant"
        ? aiMessages[aiMessages.length - 1].id
        : null
      : null;

  const showSessionLoading =
    !isStreaming &&
    (isSessionSwitchPending ||
      (Boolean(routeSessionId) &&
        routeSessionId !== streamSessionId &&
        (hydratedSessionId !== routeSessionId ||
          isSessionLoading ||
          !sessionData ||
          sessionData.id !== routeSessionId)));

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface flex h-full overflow-hidden">
      <ChatSidebar
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <main className="bg-background relative flex h-full min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <ChatMessageList
          messages={aiMessages}
          isStreaming={isStreaming}
          isSessionLoading={showSessionLoading}
          streamingMessageId={streamingMessageId}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          hasMultiplePages={Boolean(sessionPages?.pages && sessionPages.pages.length > 1)}
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
    </div>
  );
}

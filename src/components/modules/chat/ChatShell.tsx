"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage, type FileUIPart } from "ai";
import { useGetSession } from "@/hooks/data/useChats/useChats";
import { useGetSessionAttachments } from "@/hooks/data/useAttachments/useAttachments";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import { attachmentById } from "@/lib/attachments";
import { markGlobalMutation } from "@/lib/axios";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { notifyServerError } from "@/lib/server-error";
import type { MessageSchema } from "@/types";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";
import { ChatSidebar } from "./ChatSidebar";
import { Navbar } from "./Navbar";
import { ArtifactCanvas } from "./ArtifactCanvas";
import { useArtifactStore } from "@/hooks/useArtifactStore";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

function toAssistantRole(role: string): "user" | "assistant" {
  if (role === "user") return "user";
  return "assistant";
}

function ResizableCanvasPanel() {
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
        "md:static md:inset-x-auto md:top-0 md:bottom-auto md:h-full md:w-[var(--canvas-width)] md:max-w-[min(850px,calc(100vw-380px))] md:min-w-[360px] md:shrink-0 md:border-l md:border-[#313244] md:pb-0",
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

      <ArtifactCanvas />
    </div>
  );
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

  const activeSessionId = routeSessionId ?? streamSessionId ?? pendingSessionId;
  const activeModel = userSelectedModel || "Auto";
  const activeReasoning = userSelectedReasoning || "balanced";

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
      // Mark the global mutation in Axios so the subsequent profile fetch gets no-cache headers
      markGlobalMutation();

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

      if (hasSentAttachmentsRef.current) {
        queryClient.invalidateQueries({ queryKey: ["chat-attachments"] });
        hasSentAttachmentsRef.current = false;
      }

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
            if (Array.isArray(m.parts) && m.parts.length > 0) {
              for (const p of m.parts) {
                if (p.type === "text" && typeof (p as any).text === "string") {
                  parts.push({ type: "text", text: (p as any).text });
                } else if (
                  p.type === "reasoning" &&
                  typeof (p as any).text === "string"
                ) {
                  parts.push({ type: "reasoning", text: (p as any).text });
                } else if (
                  p.type === "tool" ||
                  (p as any).type === "dynamic-tool"
                ) {
                  parts.push({
                    type: "dynamic-tool",
                    toolName: (p as any).toolName || "tool",
                    toolCallId: (p as any).toolCallId || `tool-${idx}`,
                    state: (p as any).state || "output-available",
                    input: (p as any).input,
                    output: (p as any).output,
                  } as any);
                }
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
    setUserSelectedModel(null);
    setUserSelectedReasoning(null);
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
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <ChatMessageList
          messages={aiMessages}
          isStreaming={isStreaming}
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

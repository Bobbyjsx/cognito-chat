"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { useGetSession } from "@/hooks/data/useChats/useChats";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
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
    data: sessionData,
    isLoading: isSessionLoading,
    isFetching: isSessionFetching,
  } = useGetSession(routeSessionId);

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

      if (isNewChatRoute || routeSessionId !== nextId) {
        window.history.replaceState(null, "", `/chat/${nextId}`);
      }
    },
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["chat-session"] });
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
          const allowedModels = config.allowedTextModels;
          const globalAllowedReasoning = config.allowedReasoningLevels;
          const modelReasoningMap = config.modelReasoningModes ?? {};

          let validModel: string | null = null;
          if (model && allowedModels.includes(model)) {
            validModel = model;
            setUserSelectedModel(model);
          } else {
            setUserSelectedModel(null);
          }

          const modelToUse = validModel ?? config.defaultTextModel;
          const allowedReasoningForModel =
            modelReasoningMap[modelToUse] ?? globalAllowedReasoning;

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

    if (sessionData && sessionData.id === routeSessionId) {
      if (hydratedSessionId !== routeSessionId) {
        // If this session was generated by the active stream, keep live aiMessages intact
        if (streamSessionId === routeSessionId) {
          queueMicrotask(() => {
            setHydratedSessionId(routeSessionId);
            setPendingSessionId(null);
          });
          return;
        }

        const formatted: UIMessage[] = (sessionData.messages || []).map(
          (m: MessageSchema, idx: number) => ({
            id: m.id || `hist-${idx}`,
            role: toAssistantRole(m.role),
            parts: [{ type: "text" as const, text: m.content }],
          }),
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
    setAiMessages,
    hydratedSessionId,
    isStreaming,
    isNewChatRoute,
    streamSessionId,
  ]);

  const handleSendMessage = useCallback(
    (text: string, model?: string, reasoning?: string) => {
      sendMessage(
        { text },
        {
          body: {
            model: model || activeModel,
            reasoning: reasoning || activeReasoning,
            sessionId: activeSessionId || undefined,
          },
        },
      );
    },
    [sendMessage, activeModel, activeReasoning, activeSessionId],
  );

  const handleNewChat = useCallback(() => {
    if (isStreaming) return;
    setStreamSessionId(null);
    setHydratedSessionId(null);
    setPendingSessionId(null);
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
        (hydratedSessionId !== routeSessionId ||
          isSessionLoading ||
          isSessionFetching ||
          !sessionData ||
          sessionData.id !== routeSessionId)));

  const showSuggestions =
    isNewChatRoute &&
    !pendingSessionId &&
    !streamSessionId &&
    aiMessages.length === 0 &&
    !isStreaming;

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
        />

        <ChatInput
          onSend={handleSendMessage}
          onStop={stop}
          status={status}
          selectedModel={activeModel}
          onSelectModel={handleSelectModel}
          selectedReasoning={activeReasoning}
          onSelectReasoning={handleSelectReasoning}
          showSuggestions={showSuggestions}
        />
      </main>
    </div>
  );
}

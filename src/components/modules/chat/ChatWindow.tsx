"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import { useGetSession } from "@/hooks/data/useChats/useChats";
import { notifyServerError } from "@/lib/server-error";
import { MessageSchema } from "@/types";
import { Navbar } from "./Navbar";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { useQueryClient } from "@tanstack/react-query";

export function ChatWindow() {
  const queryClient = useQueryClient();
  const { data: config } = useGetConfig();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [userSelectedModel, setUserSelectedModel] = useState<string | null>(null);
  const [userSelectedReasoning, setUserSelectedReasoning] = useState<string | null>(null);

  const activeModel = userSelectedModel || config?.defaultTextModel || "gemini-3.6-flash";
  const activeReasoning = userSelectedReasoning || config?.defaultReasoningLevel || "medium";

  const { data: sessionData, isLoading: isSessionLoading } = useGetSession(activeSessionId);

  // Vercel AI SDK useChat Hook with DefaultChatTransport
  const {
    messages: aiMessages,
    setMessages: setAiMessages,
    sendMessage,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        model: activeModel,
        reasoning: activeReasoning,
        sessionId: activeSessionId || undefined,
      },
    }),
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      if (activeSessionId) {
        queryClient.invalidateQueries({ queryKey: ["chat-session", activeSessionId] });
      }
    },
    onError: (err) => {
      notifyServerError(err, "Streaming error occurred");
    },
  });

  // Sync historical messages when switching sessions
  useEffect(() => {
    if (activeSessionId && sessionData?.messages) {
      const formatted = sessionData.messages.map((m, idx) => ({
        id: m.id || `hist-${idx}`,
        role: (m.role === "model" ? "assistant" : m.role) as "user" | "assistant",
        content: m.content,
        parts: [{ type: "text" as const, text: m.content }],
      }));
      setAiMessages(formatted);
    } else if (!activeSessionId) {
      setAiMessages([]);
    }
  }, [activeSessionId, sessionData, setAiMessages]);

  const handleSendMessage = (text: string, model?: string, reasoning?: string) => {
    sendMessage(
      { text },
      {
        body: {
          model: model || activeModel,
          reasoning: reasoning || activeReasoning,
          sessionId: activeSessionId || undefined,
        },
      }
    );
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setAiMessages([]);
  };

  const isStreaming = status === "streaming" || status === "submitted";

  const messageList: MessageSchema[] = aiMessages.map((m) => {
    const textContent = (m.parts || [])
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("");

    return {
      id: m.id,
      role: m.role,
      content: textContent,
    };
  });

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            setActiveSessionId(id);
          }}
          onNewChat={handleNewChat}
        />

        <main className="flex flex-1 flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
          <ChatMessageList
            messages={messageList}
            isLoading={isStreaming || isSessionLoading}
          />

          <ChatInput
            onSend={handleSendMessage}
            isLoading={isStreaming}
            selectedModel={activeModel}
            onSelectModel={setUserSelectedModel}
            selectedReasoning={activeReasoning}
            onSelectReasoning={setUserSelectedReasoning}
          />
        </main>
      </div>
    </div>
  );
}

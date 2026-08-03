"use client";

import type { UIMessage } from "ai";
import { useLayoutEffect } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Logo } from "@/components/ui/logo";
import { useStickToBottomContext } from "use-stick-to-bottom";
import {
  AssistantMessageSkeleton,
  ChatMessageItem,
  messageHasVisibleContent,
} from "./ChatMessageItem";
import { SessionMessagesSkeleton } from "./ChatSkeletons";

interface ChatMessageListProps {
  messages: UIMessage[];
  /** True while a generation stream is open. */
  isStreaming?: boolean;
  /** True while historical session messages are loading. */
  isSessionLoading?: boolean;
  /** Id of the assistant message currently being streamed, if any. */
  streamingMessageId?: string | null;
}

export function ChatMessageList({
  messages,
  isStreaming,
  isSessionLoading,
  streamingMessageId,
}: ChatMessageListProps) {
  const lastMessage = messages[messages.length - 1];
  const lastIsAssistant = lastMessage?.role === "assistant";

  // Session history takes over the canvas. We intentionally hide any stale
  // messages while the next session is loading so the transition stays local.
  const showSessionSkeleton = Boolean(isSessionLoading) && !isStreaming;

  // Agent reply placeholder before first tokens
  const showAgentSkeleton = Boolean(isStreaming) && !lastIsAssistant;

  const isEmpty = messages.length === 0 && !isStreaming && !isSessionLoading;

  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="mx-auto w-full max-w-[800px] gap-8 px-4 pt-6 pb-8 md:px-0">
        {showSessionSkeleton ? (
          <SessionMessagesSkeleton />
        ) : isEmpty ? (
          <ConversationEmptyState
            className="flex min-h-[50vh] flex-col items-center justify-center text-center"
            title="How can I assist you today?"
            description="Ask anything. Powered by Gemini with reasoning and tools."
            icon={<Logo logoOnly iconClassName="h-10 w-10 text-on-surface" />}
          />
        ) : (
          <>
            {messages.map((msg) => {
              const isThisStreaming = Boolean(
                isStreaming && msg.id && msg.id === streamingMessageId,
              );
              const emptyStreamingAssistant =
                Boolean(isStreaming) &&
                msg.role === "assistant" &&
                msg.id === lastMessage?.id &&
                !messageHasVisibleContent(msg);

              return (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  isStreaming={isThisStreaming || emptyStreamingAssistant}
                />
              );
            })}

            {showAgentSkeleton && <AssistantMessageSkeleton />}
          </>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

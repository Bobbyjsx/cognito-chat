"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Logo } from "@/components/ui/logo";
import type { UIMessage } from "ai";
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

  // Session history takes over the canvas (don't mix with live stream UI)
  const showSessionSkeleton =
    Boolean(isSessionLoading) && !isStreaming && messages.length === 0;

  // Agent reply placeholder before first tokens
  const showAgentSkeleton =
    Boolean(isStreaming) && !lastIsAssistant;

  const isEmpty =
    messages.length === 0 && !isStreaming && !isSessionLoading;

  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="mx-auto w-full max-w-[800px] gap-8 px-4 pb-8 pt-6 md:px-0">
        {showSessionSkeleton ? (
          <SessionMessagesSkeleton />
        ) : isEmpty ? (
          <ConversationEmptyState
            className="min-h-[50vh] flex flex-col items-center justify-center text-center"
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

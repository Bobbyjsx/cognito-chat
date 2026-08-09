"use client";

import type { UIMessage } from "ai";
import { useLayoutEffect } from "react";
import { VirtualMessageList } from "./VirtualMessageList";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Logo } from "@/components/ui/logo";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { SessionMessagesSkeleton } from "./ChatSkeletons";

interface ChatMessageListProps {
  messages: UIMessage[];
  /** True while a generation stream is open. */
  isStreaming?: boolean;
  /** True while historical session messages are loading. */
  isSessionLoading?: boolean;
  /** Id of the assistant message currently being streamed, if any. */
  streamingMessageId?: string | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function ChatMessageList({
  messages,
  isStreaming,
  isSessionLoading,
  streamingMessageId,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
}: ChatMessageListProps) {
  const lastMessage = messages[messages.length - 1];
  const lastIsAssistant = lastMessage?.role === "assistant";

  // Session history takes over the canvas. We intentionally hide any stale
  // messages while the next session is loading so the transition stays local.
  const showSessionSkeleton = Boolean(isSessionLoading) && !isStreaming;

  // Agent reply placeholder before first tokens
  const showAgentSkeleton = Boolean(isStreaming) && !lastIsAssistant;

  const isEmpty = messages.length === 0 && !isStreaming && !isSessionLoading;

  // When switching sessions, the temporary skeleton shrinks the scroll
  // container and the browser clamps scrollTop to the top. Once the target
  // session's messages mount, jump back to the bottom so the user lands on
  // the latest message instead of the top of the conversation.
  const showScrollToBottom = !showSessionSkeleton && !isStreaming && !isEmpty;

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
          <VirtualMessageList
            messages={messages}
            isStreaming={isStreaming}
            streamingMessageId={streamingMessageId}
            showAgentSkeleton={showAgentSkeleton}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        )}
        <ScrollToBottomOnReady shouldScroll={showScrollToBottom} />
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

function ScrollToBottomOnReady({ shouldScroll }: { shouldScroll: boolean }) {
  const { scrollRef } = useStickToBottomContext();

  useLayoutEffect(() => {
    // scrollToBottom() from the context starts an rAF animation loop that is
    // gated on the library's own isAtBottom state, which isn't settled yet
    // when called from an effect (it works from click handlers only). Setting
    // the scroll position directly is deterministic; the library observes the
    // resulting scroll event and re-sticks to the bottom itself.
    if (shouldScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shouldScroll, scrollRef]);

  return null;
}

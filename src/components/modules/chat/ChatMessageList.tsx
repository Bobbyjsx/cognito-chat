"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";

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

interface VirtualMessageListProps {
  messages: UIMessage[];
  isStreaming?: boolean;
  streamingMessageId?: string | null;
  showAgentSkeleton?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

function VirtualMessageList({
  messages,
  isStreaming,
  streamingMessageId,
  showAgentSkeleton,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: VirtualMessageListProps) {
  const { scrollRef } = useStickToBottomContext();
  const lastMessage = messages[messages.length - 1];

  const virtualizer = useVirtualizer({
    count: messages.length + (showAgentSkeleton ? 1 : 0),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 150,
    overscan: 5,
  });

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="flex h-[60px] w-full flex-shrink-0 items-center justify-center">
        {hasNextPage && fetchNextPage ? (
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage ?? false}
            fetchNextPage={fetchNextPage}
            loadingMessage="Loading older messages..."
            endMessage="No more messages"
            className="py-2"
          />
        ) : (
          <span className="py-4 text-center text-xs text-gray-400 italic">
            {messages.length > 0 ? "You're all caught up" : ""}
          </span>
        )}
      </div>

      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          if (showAgentSkeleton && virtualItem.index === messages.length) {
            return (
              <div
                key="agent-skeleton"
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <AssistantMessageSkeleton />
              </div>
            );
          }

          const msg = messages[virtualItem.index];
          if (!msg) return null;

          const isThisStreaming = Boolean(
            isStreaming && msg.id && msg.id === streamingMessageId,
          );
          const emptyStreamingAssistant =
            Boolean(isStreaming) &&
            msg.role === "assistant" &&
            msg.id === lastMessage?.id &&
            !messageHasVisibleContent(msg);

          return (
            <div
              key={msg.id || virtualItem.index}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ChatMessageItem
                message={msg}
                isStreaming={isThisStreaming || emptyStreamingAssistant}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

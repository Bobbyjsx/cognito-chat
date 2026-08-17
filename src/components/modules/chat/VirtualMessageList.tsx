"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import type { UIMessage } from "ai";
import { useStickToBottomContext } from "use-stick-to-bottom";
import {
  AssistantMessageSkeleton,
  ChatMessageItem,
  messageHasVisibleContent,
} from "./ChatMessageItem";

export interface VirtualMessageListProps {
  messages: UIMessage[];
  isStreaming?: boolean;
  streamingMessageId?: string | null;
  showAgentSkeleton?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  hasMultiplePages?: boolean;
}

export function VirtualMessageList({
  messages,
  isStreaming,
  streamingMessageId,
  showAgentSkeleton,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  hasMultiplePages,
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
            {hasMultiplePages && messages.length > 0 ? "You're all caught up" : ""}
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

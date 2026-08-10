"use client";

import type { UIMessage } from "ai";
import { useLayoutEffect } from "react";
import { VirtualMessageList } from "./VirtualMessageList";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { SessionMessagesSkeleton } from "./ChatSkeletons";
import {
  Lightbulb,
  Code2,
  PenLine,
  ImageIcon,
  Globe,
  FlaskConical,
} from "lucide-react";
import type { ReactNode } from "react";

interface SuggestionPrompt {
  icon: ReactNode;
  label: string;
  description: string;
  text: string;
}

const EMPTY_STATE_PROMPTS: SuggestionPrompt[] = [
  {
    icon: <Lightbulb className="h-4 w-4" />,
    label: "Explain a concept",
    description: "Break down a complex topic simply",
    text: "Explain quantum computing in simple terms",
  },
  {
    icon: <Code2 className="h-4 w-4" />,
    label: "Write code",
    description: "Generate scripts, functions, or full programs",
    text: "Write a Python script to parse JSON data from a file",
  },
  {
    icon: <PenLine className="h-4 w-4" />,
    label: "Write or edit",
    description: "Draft, refine, or summarise text",
    text: "Help me write a professional email to reschedule a meeting",
  },
  {
    icon: <Globe className="h-4 w-4" />,
    label: "Research a topic",
    description: "Summarise and fact-check information",
    text: "Summarise the latest advances in large language models",
  },
];

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
  /** Called when the user clicks a suggestion card on the empty state. */
  onSuggestionClick?: (text: string) => void;
}

export function ChatMessageList({
  messages,
  isStreaming,
  isSessionLoading,
  streamingMessageId,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  onSuggestionClick,
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
      <ConversationContent className="mx-auto w-full max-w-[800px] gap-8 px-4 pt-6 pb-8 md:px-6 lg:px-0">
        {showSessionSkeleton ? (
          <SessionMessagesSkeleton />
        ) : isEmpty ? (
          <div className="flex min-h-[55vh] flex-col items-center justify-center gap-10 py-8 text-center">
            {/* Heading */}
            <div className="space-y-3">
              <h1 className="text-on-surface text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem]">
                What can I help with?
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Ask anything, or choose a suggestion to get started.
              </p>
            </div>

            {/* Suggestion card grid */}
            <div className="grid w-full max-w-[640px] grid-cols-1 gap-2 sm:grid-cols-2">
              {EMPTY_STATE_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => onSuggestionClick?.(prompt.text)}
                  className="group border-border/50 bg-surface-container-low/50 hover:border-border hover:bg-surface-container-low flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
                >
                  <span className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-150">
                    {prompt.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-on-surface text-sm font-medium">
                      {prompt.label}
                    </p>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                      {prompt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
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

"use client";

import { useState, useEffect, useMemo } from "react";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import type { UserProfile } from "@/types";

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
import { Lightbulb, Code2, PenLine, Globe } from "lucide-react";
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
  /** True while a background generation is actively running on the server. */
  hasActiveBackgroundGeneration?: boolean;
  /** True while historical session messages are loading. */
  isSessionLoading?: boolean;
  /** Id of the assistant message currently being streamed, if any. */
  streamingMessageId?: string | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  hasMultiplePages?: boolean;
  /** Called when the user clicks a suggestion card on the empty state. */
  onSuggestionClick?: (text: string) => void;
}

export function ChatMessageList({
  messages,
  isStreaming,
  hasActiveBackgroundGeneration,
  isSessionLoading,
  streamingMessageId,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  hasMultiplePages = false,
  onSuggestionClick,
}: ChatMessageListProps) {
  const lastMessage = messages[messages.length - 1];
  const lastIsAssistant = lastMessage?.role === "assistant";

  // Session history takes over the canvas when no messages are available yet.
  const showSessionSkeleton =
    Boolean(isSessionLoading) && !isStreaming && messages.length === 0;

  // Agent reply placeholder before first tokens
  const showAgentSkeleton =
    (Boolean(isStreaming) || Boolean(hasActiveBackgroundGeneration)) &&
    !lastIsAssistant;

  const isEmpty =
    messages.length === 0 &&
    !isStreaming &&
    !hasActiveBackgroundGeneration &&
    !isSessionLoading;

  // When switching sessions, the temporary skeleton shrinks the scroll
  // container and the browser clamps scrollTop to the top. Once the target
  // session's messages mount, jump back to the bottom so the user lands on
  // the latest message instead of the top of the conversation.
  const showScrollToBottom = !showSessionSkeleton && !isStreaming && !isEmpty;

  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="mx-auto flex min-h-full w-full max-w-[800px] flex-col gap-6 px-3 pt-4 pb-[140px] sm:gap-8 sm:px-4 sm:pt-6 sm:pb-[160px] md:px-6 lg:px-0">
        {showSessionSkeleton ? (
          <SessionMessagesSkeleton />
        ) : isEmpty ? (
          <div className="my-auto flex w-full flex-col items-center justify-center gap-5 py-4 text-center sm:gap-7 sm:py-6">
            {/* Heading */}
            <div className="space-y-1.5 sm:space-y-2">
              <DynamicGreeting />
              <p className="text-muted-foreground text-xs sm:text-sm">
                Ask anything, or choose a suggestion to get started.
              </p>
            </div>

            {/* Suggestion pill/card grid */}
            <div className="grid w-full max-w-[640px] grid-cols-2 gap-2 sm:gap-2.5">
              {EMPTY_STATE_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => onSuggestionClick?.(prompt.text)}
                  className="group border-border/50 bg-surface-container-low/70 hover:border-border hover:bg-surface-container-low flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-150 hover:shadow-xs active:scale-[0.98] sm:items-start sm:gap-3.5 sm:rounded-2xl sm:p-3.5"
                >
                  <span className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 sm:h-8 sm:w-8 sm:rounded-xl">
                    {prompt.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-on-surface truncate text-xs font-medium sm:text-sm">
                      {prompt.label}
                    </p>
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 hidden text-xs sm:block">
                      {prompt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Disclaimer (only shown on new chats) */}
            <p className="font-label-md text-gray-medium pt-2 text-center text-[10px] sm:text-[11px]">
              Cognito Chat can make mistakes. Consider verifying important
              information.
            </p>
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
            hasMultiplePages={hasMultiplePages}
          />
        )}
        <ScrollToBottomOnReady shouldScroll={showScrollToBottom} />
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

function getFirstName(profile?: UserProfile) {
  if (!profile) return "";
  if (profile.firstName) return profile.firstName;
  if (profile.fullName) return profile.fullName.split(" ")[0];
  return "";
}

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function DynamicGreeting() {
  const { data: profile, isLoading } = useProfile();
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const firstName = getFirstName(profile);
    const timeGreeting = getTimeBasedGreeting();

    const options = [
      "What can I help with?",
      firstName ? `${timeGreeting}, ${firstName}` : timeGreeting,
      firstName ? `Ready to dive in, ${firstName}?` : "Ready to dive in?",
      firstName
        ? `Hi ${firstName}, shoot me a message.`
        : "Hi, shoot me a message.",
      firstName
        ? `How can I assist you today, ${firstName}?`
        : "How can I assist you today?",
      firstName
        ? `Let's build something great, ${firstName}.`
        : "Let's build something great.",
    ];

    const randomIndex = Math.floor(Math.random() * options.length);
    // eslint-disable-next-line
    setGreeting(options[randomIndex]);
  }, [isLoading, profile]);

  if (!greeting) {
    return (
      <h1 className="text-2xl font-semibold tracking-tight text-transparent sm:text-3xl md:text-4xl">
        What can I help with?
      </h1>
    );
  }

  return (
    <h1 className="text-on-surface animate-in fade-in text-2xl font-semibold tracking-tight duration-500 sm:text-3xl md:text-4xl">
      {greeting}
    </h1>
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

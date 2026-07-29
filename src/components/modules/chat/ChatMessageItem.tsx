"use client";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { isToolUIPart, type UIMessage } from "ai";
import { AlertCircle, Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import {
  AgentResponseBodySkeleton,
  AgentResponseSkeleton,
  AssistantHeader,
} from "./ChatSkeletons";

interface ChatMessageItemProps {
  message: UIMessage;
  isStreaming?: boolean;
}

function getLegacyContent(message: UIMessage): string {
  const raw = (message as unknown as Record<string, unknown>).content;
  return typeof raw === "string" ? raw : "";
}

/** True once any visible assistant content has arrived (text, thoughts, or tools). */
export function messageHasVisibleContent(message: UIMessage): boolean {
  if (getLegacyContent(message).trim().length > 0) {
    return true;
  }
  return (message.parts ?? []).some((part) => {
    if (part.type === "text" && part.text.trim().length > 0) return true;
    if (part.type === "reasoning" && part.text.trim().length > 0) return true;
    if (isToolUIPart(part)) return true;
    return false;
  });
}

function getMessagePlainText(message: UIMessage): string {
  const legacy = getLegacyContent(message).trim();
  if (legacy) return legacy;

  return (message.parts ?? [])
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => (part as { text: string }).text)
    .join("\n")
    .trim();
}

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked
    }
  }, [text]);

  if (!text) return null;

  return (
    <MessageActions className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      <MessageAction
        tooltip={copied ? "Copied" : "Copy"}
        label={copied ? "Copied" : "Copy message"}
        onClick={handleCopy}
        className="h-8 w-8 text-gray-medium hover:text-on-surface"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </MessageAction>
    </MessageActions>
  );
}

function MessageParts({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming?: boolean;
}) {
  const parts = message.parts ?? [];
  const legacyContent = getLegacyContent(message);

  // Fallback for legacy plain text messages
  if (parts.length === 0 && legacyContent.trim()) {
    return <MessageResponse>{legacyContent}</MessageResponse>;
  }

  const waitingForFirstToken =
    Boolean(isStreaming) && !messageHasVisibleContent(message);

  if (waitingForFirstToken || parts.length === 0) {
    if (isStreaming) {
      return <AgentResponseBodySkeleton />;
    }
    return null;
  }

  return (
    <>
      {parts.map((part, index) => {
        const key = `${message.id}-${part.type}-${index}`;

        if (part.type === "text") {
          // Skip empty text shells that AI SDK may open before content arrives
          if (!part.text.trim() && isStreaming) {
            return null;
          }
          const animating =
            Boolean(isStreaming) &&
            (part.state === "streaming" || index === parts.length - 1);
          return (
            <MessageResponse key={key} isAnimating={animating}>
              {part.text}
            </MessageResponse>
          );
        }

        if (part.type === "reasoning") {
          if (!part.text.trim() && isStreaming) {
            return null;
          }
          const reasoningStreaming =
            part.state === "streaming" ||
            (Boolean(isStreaming) && index === parts.length - 1);
          return (
            <Reasoning
              key={key}
              className="w-full"
              isStreaming={reasoningStreaming}
              defaultOpen={reasoningStreaming}
            >
              <ReasoningTrigger />
              <ReasoningContent>{part.text}</ReasoningContent>
            </Reasoning>
          );
        }

        if (isToolUIPart(part)) {
          const isDynamic = part.type === "dynamic-tool";
          const toolName = isDynamic
            ? part.toolName
            : part.type.slice("tool-".length);
          const openByDefault =
            part.state === "input-streaming" ||
            part.state === "input-available" ||
            part.state === "output-error";

          return (
            <Tool key={part.toolCallId || key} defaultOpen={openByDefault}>
              {isDynamic ? (
                <ToolHeader
                  type="dynamic-tool"
                  state={part.state}
                  toolName={toolName}
                />
              ) : (
                <ToolHeader type={part.type} state={part.state} />
              )}
              <ToolContent>
                {"input" in part && part.input ? (
                  <ToolInput input={part.input} />
                ) : null}
                <ToolOutput
                  output={"output" in part ? part.output : undefined}
                  errorText={
                    "errorText" in part ? part.errorText : undefined
                  }
                />
              </ToolContent>
            </Tool>
          );
        }

        return null;
      })}
    </>
  );
}

/** Placeholder assistant row when stream is open but no assistant message exists yet. */
export function AssistantMessageSkeleton() {
  return <AgentResponseSkeleton />;
}

export function ChatMessageItem({ message, isStreaming }: ChatMessageItemProps) {
  const from = message.role === "user" ? "user" : "assistant";
  const plainText = getMessagePlainText(message);
  const showCopy = Boolean(plainText) && !isStreaming;

  if (from === "user") {
    return (
      <Message from="user" className="items-end">
        <MessageContent>
          <MessageParts message={message} />
        </MessageContent>
        {showCopy ? <CopyMessageButton text={plainText} /> : null}
      </Message>
    );
  }

  const msgObj = message as unknown as Record<string, unknown>;
  const hasExplicitError = Boolean(msgObj.error);
  const isContentEmpty = !messageHasVisibleContent(message);
  const hasFailed = !isStreaming && (hasExplicitError || isContentEmpty);
  const errorDetail =
    (msgObj.error as string) || "Model generation failed. Please try again.";

  const waitingForFirstToken =
    Boolean(isStreaming) && !messageHasVisibleContent(message);

  return (
    <Message from="assistant" className="max-w-full">
      <AssistantHeader isWaiting={waitingForFirstToken} />
      <MessageContent className="w-full max-w-full">
        {hasFailed ? (
          <div className="my-2 space-y-1 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left">
            <div className="flex items-center gap-2 font-medium text-sm text-red-900 dark:text-red-200">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>There was a problem responding to your message.</span>
            </div>
            <p className="pl-6 font-mono text-xs text-red-700/80 dark:text-red-300/70">
              {errorDetail}
            </p>
          </div>
        ) : (
          <MessageParts message={message} isStreaming={isStreaming} />
        )}
      </MessageContent>
      {showCopy && !hasFailed ? <CopyMessageButton text={plainText} /> : null}
    </Message>
  );
}

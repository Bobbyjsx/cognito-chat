"use client";

import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { History, Loader2 } from "lucide-react";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden
    />
  );
}

function AssistantHeader({ isWaiting }: { isWaiting?: boolean }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <Logo
        logoOnly
        iconContainerClassName={cn(
          "h-6 w-6 rounded bg-primary border-none shadow-none text-on-primary",
          isWaiting && "animate-pulse",
        )}
        iconClassName={cn(
          "h-[14px] w-[14px] text-on-primary",
          isWaiting && "animate-spin",
        )}
      />
      <span className="font-label-md text-label-md font-bold text-primary">
        Cognito
      </span>
      <span className="rounded border border-border-subtle bg-gray-light px-2 py-0.5 font-label-md text-[10px] uppercase tracking-wider text-gray-medium">
        Agent
      </span>
    </div>
  );
}

/**
 * Loading state while generating a reply (stream open, no first token yet).
 * Active feel: spinning logo, shimmer “Thinking…”, short content bones.
 */
export function AgentResponseSkeleton() {
  return (
    <Message from="assistant" className="max-w-full" aria-busy="true">
      <AssistantHeader isWaiting />
      <MessageContent className="w-full max-w-full">
        <div
          className="w-full max-w-md space-y-3"
          aria-label="Waiting for agent response"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            <Shimmer className="text-sm" duration={1.2}>
              Thinking...
            </Shimmer>
          </div>
          <div className="space-y-2">
            <Bone className="h-3.5 w-[92%]" />
            <Bone className="h-3.5 w-[78%]" />
            <Bone className="h-3.5 w-[64%]" />
            <Bone className="h-3.5 w-[40%]" />
          </div>
        </div>
      </MessageContent>
    </Message>
  );
}

/**
 * Inline body skeleton used inside an existing empty assistant message while streaming.
 */
export function AgentResponseBodySkeleton() {
  return (
    <div
      className="w-full max-w-md space-y-3"
      aria-busy="true"
      aria-label="Waiting for agent response"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        <Shimmer className="text-sm" duration={1.2}>
          Thinking...
        </Shimmer>
      </div>
      <div className="space-y-2">
        <Bone className="h-3.5 w-[92%]" />
        <Bone className="h-3.5 w-[78%]" />
        <Bone className="h-3.5 w-[64%]" />
        <Bone className="h-3.5 w-[40%]" />
      </div>
    </div>
  );
}

function SessionUserBubbleSkeleton({ widths }: { widths: string[] }) {
  return (
    <div className="flex w-full flex-col items-end">
      <div className="w-full max-w-[70%] space-y-2 rounded-xl rounded-tr-sm border border-border-subtle bg-secondary px-4 py-3">
        {widths.map((w, i) => (
          <Bone key={i} className={cn("h-3.5", w)} />
        ))}
      </div>
    </div>
  );
}

function SessionAssistantBubbleSkeleton({ widths }: { widths: string[] }) {
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <Bone className="size-6 rounded" />
        <Bone className="h-3 w-16" />
        <Bone className="h-4 w-12 rounded" />
      </div>
      <div className="w-full max-w-[85%] space-y-2">
        {widths.map((w, i) => (
          <Bone key={i} className={cn("h-3.5", w)} />
        ))}
      </div>
    </div>
  );
}

/**
 * Loading state while fetching a session’s message history.
 * Passive feel: full thread of user/assistant bones + “Loading conversation” label.
 * No agent “Thinking…” shimmer — that is reserved for generation.
 */
export function SessionMessagesSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-8"
      aria-busy="true"
      aria-label="Loading conversation"
    >
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <History className="size-3.5 animate-pulse" />
        <span className="font-label-md text-sm">Loading conversation…</span>
      </div>

      <SessionUserBubbleSkeleton widths={["w-[88%]", "w-[55%]"]} />
      <SessionAssistantBubbleSkeleton
        widths={["w-full", "w-[94%]", "w-[86%]", "w-[72%]", "w-[48%]"]}
      />
      <SessionUserBubbleSkeleton widths={["w-[70%]"]} />
      <SessionAssistantBubbleSkeleton
        widths={["w-[96%]", "w-[90%]", "w-[62%]"]}
      />
      <SessionUserBubbleSkeleton widths={["w-[80%]", "w-[40%]"]} />
    </div>
  );
}

export { AssistantHeader };

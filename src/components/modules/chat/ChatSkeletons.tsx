"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { History, Loader2 } from "lucide-react";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-muted animate-pulse rounded-md", className)}
      aria-hidden
    />
  );
}

function AssistantHeader({
  isWaiting: _isWaiting,
}: { isWaiting?: boolean } = {}) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <Logo
        logoOnly
        iconContainerClassName="h-6 w-6 rounded bg-primary border-none shadow-none text-on-primary"
        iconClassName="h-[14px] w-[14px] text-on-primary"
      />
      <span className="font-label-md text-label-md text-primary font-bold">
        Cognito
      </span>
    </div>
  );
}

/**
 * Loading state while generating a reply (stream open, no first token yet).
 */
export function AgentResponseSkeleton() {
  return (
    <Message from="assistant" className="max-w-full" aria-busy="true">
      <AssistantHeader />
      <MessageContent className="w-full max-w-full">
        <div
          className="w-full max-w-md space-y-3"
          aria-label="Waiting for agent response"
        >
          <div className="text-muted-foreground flex items-center gap-2">
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

/** Body skeleton for an existing message shell waiting for first token */
export function AgentResponseBodySkeleton() {
  return (
    <div
      className="w-full max-w-md space-y-3 py-1"
      aria-label="Waiting for first tokens"
    >
      <div className="text-muted-foreground flex items-center gap-2">
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

/** Canvas loading skeleton while fetching past session messages */
export function SessionMessagesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[800px] space-y-8 px-4 py-4 md:px-0">
      <div className="flex flex-col items-end gap-2">
        <Bone className="h-4 w-28 self-end" />
        <Bone className="h-16 w-3/4 rounded-2xl" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bone className="h-6 w-6 rounded" />
          <Bone className="h-4 w-20" />
        </div>
        <div className="space-y-2 pl-8">
          <Bone className="h-4 w-[95%]" />
          <Bone className="h-4 w-[88%]" />
          <Bone className="h-4 w-[72%]" />
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <Bone className="h-4 w-24 self-end" />
        <Bone className="h-12 w-2/3 rounded-2xl" />
      </div>
    </div>
  );
}

/** Sidebar recent conversations loading skeleton */
export function RecentConversationsSkeleton() {
  return (
    <div className="space-y-1 px-1 py-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5"
        >
          <div className="flex flex-1 items-center gap-2.5">
            <History className="text-gray-medium/50 h-4 w-4 shrink-0" />
            <Bone className="h-3.5 w-3/4 rounded" />
          </div>
          <Bone className="h-3 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

export { AssistantHeader };

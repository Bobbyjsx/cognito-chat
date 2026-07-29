"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { useGetSessions } from "@/hooks/data/useChats/useChats";
import { cn } from "@/lib/utils";
import { Archive, HelpCircle, History, Plus, Settings } from "lucide-react";
import { motion } from "framer-motion";

interface ChatSidebarProps {
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return "";

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ChatSidebar({
  activeSessionId,
  onSelectSession,
  onNewChat,
}: ChatSidebarProps) {
  const { data: sessions, isLoading } = useGetSessions();

  return (
    <nav className="relative z-20 hidden h-screen w-64 shrink-0 flex-col border-r border-[rgba(0,0,0,0.06)] bg-surface-container-low p-4 md:flex">
      <div className="mb-6 flex items-center gap-3 px-1">
        <Link href="/chat" onClick={onNewChat} className="flex items-center gap-2">
          <Logo />
        </Link>
      </div>

      <motion.button
        type="button"
        onClick={onNewChat}
        whileTap={{ scale: 0.98 }}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-md text-label-md font-medium text-on-primary shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-[#3d3f42] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
      >
        <Plus className="h-[18px] w-[18px]" />
        New chat
      </motion.button>

      <div className="flex-grow space-y-1 overflow-y-auto pr-1">
        <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-gray-medium">
          Recent conversations
        </div>
        {isLoading ? (
          <div className="space-y-2 px-2 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-full animate-pulse rounded-lg bg-surface-container"
              />
            ))}
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[rgba(0,0,0,0.08)] px-3 py-4 text-center text-xs text-gray-medium">
            No previous chats
          </div>
        ) : (
          <div className="space-y-0.5">
            {sessions.map((session) => {
              const sessionTitle =
                session.title?.trim() || session.lastMessageContent?.trim() || "New Conversation";
              const isActive = activeSessionId === session.id;
              const isUnread = session.readStatus === "not read" && !isActive;
              const relativeTime = formatRelativeTime(session.updatedAt || session.createdAt);

              return (
                <Link
                  key={session.id}
                  href={`/chat/${session.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectSession(session.id);
                  }}
                  className={cn(
                    "group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-body-md transition-all duration-200",
                    isActive
                      ? "bg-white text-on-surface font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.04)]"
                      : isUnread
                        ? "text-on-surface font-semibold bg-surface-container/60 hover:bg-surface-container"
                        : "text-gray-medium hover:bg-surface-container hover:text-on-surface",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <History className={cn("h-4 w-4 shrink-0 transition-colors", isActive || isUnread ? "text-on-surface" : "text-gray-medium group-hover:text-on-surface")} />
                    <span className="truncate font-body-md text-body-md">
                      {sessionTitle}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {relativeTime && (
                      <span className="font-code-sm text-[10px] text-gray-medium/80 group-hover:text-gray-medium">
                        {relativeTime}
                      </span>
                    )}
                    {isUnread && (
                      <span
                        title="Unread message"
                        className="h-2 w-2 rounded-full bg-primary animate-pulse"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="my-4 border-t border-[rgba(0,0,0,0.06)]" />
        
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-body-md text-gray-medium transition-colors duration-200 hover:bg-surface-container hover:text-on-surface"
        >
          <Archive className="h-4 w-4" />
          <span className="truncate font-body-md text-body-md">Archive</span>
        </button>
      </div>

      <div className="mt-auto space-y-1 border-t border-[rgba(0,0,0,0.06)] pt-4">
        <Link
          href="/settings"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-body-md text-gray-medium transition-colors duration-200 hover:bg-surface-container hover:text-on-surface"
        >
          <Settings className="h-4 w-4" />
          <span className="font-body-md text-body-md">Settings</span>
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-body-md text-gray-medium transition-colors duration-200 hover:bg-surface-container hover:text-on-surface"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="font-body-md text-body-md">Support</span>
        </button>
      </div>
    </nav>
  );
}

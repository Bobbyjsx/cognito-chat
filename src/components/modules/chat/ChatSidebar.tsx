"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { useGetSessions, useDeleteSession } from "@/hooks/data/useChats/useChats";
import { cn } from "@/lib/utils";
import { History, Loader2, Plus, Search, Settings, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

function RecentConversationsSkeleton() {
  const widths = ["w-3/4", "w-2/3", "w-4/5", "w-3/5", "w-1/2"];

  return (
    <div className="space-y-1 px-1 py-1">
      {widths.map((wClass, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5"
        >
          <div className="flex flex-1 items-center gap-2.5">
            <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-surface-container-high/70" />
            <div
              className={cn(
                "h-3.5 animate-pulse rounded bg-surface-container-high/80",
                wClass,
              )}
            />
          </div>
          <div className="h-3 w-8 shrink-0 animate-pulse rounded bg-surface-container-high/50" />
        </div>
      ))}
    </div>
  );
}

export function ChatSidebar({
  activeSessionId,
  onSelectSession,
  onNewChat,
}: ChatSidebarProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: sessions, isLoading } = useGetSessions(debouncedQuery);
  const deleteSessionMutation = useDeleteSession();

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();

    deleteSessionMutation.mutate(sessionId, {
      onSuccess: () => {
        toast.success("Conversation deleted");
        if (activeSessionId === sessionId) {
          onNewChat();
          router.push("/chat");
        }
      },
      onError: () => {
        toast.error("Failed to delete conversation");
      },
    });
  };

  return (
    <nav className="relative z-20 hidden h-screen w-64 shrink-0 flex-col border-r border-[rgba(0,0,0,0.06)] bg-surface-container-low p-4 md:flex">
      <div className="mb-4 flex items-center gap-3 px-1">
        <Link href="/chat" onClick={onNewChat} className="flex items-center gap-2">
          <Logo />
        </Link>
      </div>

      <motion.button
        type="button"
        onClick={onNewChat}
        whileTap={{ scale: 0.98 }}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-md text-label-md font-medium text-on-primary shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-[#3d3f42] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
      >
        <Plus className="h-[18px] w-[18px]" />
        New chat
      </motion.button>

      {/* Lightning Fast Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-medium" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search chats..."
          className="w-full rounded-lg border border-[rgba(0,0,0,0.06)] bg-white py-1.5 pl-8 pr-8 text-xs text-on-surface placeholder:text-gray-medium/70 focus:border-on-surface/30 focus:outline-none transition-all duration-200"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-medium hover:text-on-surface"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex-grow space-y-1 overflow-y-auto pr-1">
        <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-gray-medium">
          <span>{debouncedQuery ? "Search results" : "Recent conversations"}</span>
        </div>

        {isLoading ? (
          <RecentConversationsSkeleton />
        ) : !sessions || sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[rgba(0,0,0,0.08)] px-3 py-4 text-center text-xs text-gray-medium">
            {debouncedQuery ? "No matching conversations" : "No previous chats"}
          </div>
        ) : (
          <div className="space-y-0.5">
            <AnimatePresence initial={false}>
              {sessions.map((session) => {
                const sessionTitle =
                  session.title?.trim() || session.lastMessageContent?.trim() || "New Conversation";
                const isActive = activeSessionId === session.id;
                const isUnread = session.readStatus === "not read" && !isActive;
                const relativeTime = formatRelativeTime(session.updatedAt || session.createdAt);
                const isDeleting =
                  deleteSessionMutation.isPending &&
                  deleteSessionMutation.variables === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      if (isDeleting) return;
                      onSelectSession(session.id);
                      router.push(`/chat/${session.id}`);
                    }}
                    className={cn(
                      "group relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-body-md transition-all duration-200",
                      isActive
                        ? "bg-white text-on-surface font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.04)]"
                        : isUnread
                          ? "text-on-surface font-semibold bg-surface-container/60 hover:bg-surface-container"
                          : "text-gray-medium hover:bg-surface-container hover:text-on-surface",
                      isDeleting && "opacity-60 pointer-events-none",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <History className={cn("h-4 w-4 shrink-0 transition-colors", isActive || isUnread ? "text-on-surface" : "text-gray-medium group-hover:text-on-surface")} />
                      <span className="truncate font-body-md text-body-md">
                        {sessionTitle}
                      </span>
                    </div>

                    <div
                      className="flex shrink-0 items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {relativeTime && !isDeleting && (
                        <span className="font-code-sm text-[10px] text-gray-medium/80 group-hover:text-gray-medium group-hover:hidden">
                          {relativeTime}
                        </span>
                      )}
                      {isUnread && !isDeleting && (
                        <span
                          title="Unread message"
                          className="h-2 w-2 rounded-full bg-primary animate-pulse group-hover:hidden"
                        />
                      )}

                      {/* Soft Delete Action Button with Loading State */}
                      <button
                        type="button"
                        disabled={deleteSessionMutation.isPending}
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        title="Delete conversation"
                        className={cn(
                          "p-1 text-gray-medium/70 hover:text-error hover:bg-error/10 rounded transition-colors",
                          isDeleting ? "block text-error" : "hidden group-hover:block",
                        )}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-[rgba(0,0,0,0.06)] pt-4">
        <Link
          href="/settings"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-body-md text-gray-medium transition-colors duration-200 hover:bg-surface-container hover:text-on-surface"
        >
          <Settings className="h-4 w-4" />
          <span className="font-body-md text-body-md">Settings</span>
        </Link>
      </div>
    </nav>
  );
}

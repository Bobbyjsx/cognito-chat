"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import {
  useGetSessions,
  useDeleteSession,
} from "@/hooks/data/useChats/useChats";
import { cn } from "@/lib/utils";
import {
  History,
  Loader2,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
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
            <div className="bg-surface-container-high/70 h-4 w-4 shrink-0 animate-pulse rounded" />
            <div
              className={cn(
                "bg-surface-container-high/80 h-3.5 animate-pulse rounded",
                wClass,
              )}
            />
          </div>
          <div className="bg-surface-container-high/50 h-3 w-8 shrink-0 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

export function ChatSidebar({
  activeSessionId,
  onSelectSession,
  onNewChat,
  open = false,
  onOpenChange,
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

  const closeSidebar = () => {
    onOpenChange?.(false);
  };

  const sidebarContent = (
    <div className="flex h-full w-full flex-col p-4">
      <div className="mb-4 flex items-center justify-between px-1">
        <Link
          href="/chat"
          scroll={false}
          onClick={() => {
            onNewChat();
            closeSidebar();
          }}
          className="flex items-center gap-2"
        >
          <Logo />
        </Link>
        {onOpenChange && (
          <button
            type="button"
            onClick={closeSidebar}
            className="text-gray-medium hover:bg-surface-container hover:text-on-surface rounded-lg p-1.5 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <Link
        href="/chat"
        scroll={false}
        onClick={(e) => {
          onNewChat();
          closeSidebar();
        }}
        className="bg-primary font-label-md text-label-md text-on-primary mb-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-[#3d3f42] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] active:scale-[0.98]"
      >
        <Plus className="h-[18px] w-[18px]" />
        New chat
      </Link>

      {/* Lightning Fast Search Input */}
      <div className="relative mb-4">
        <Search className="text-gray-medium absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search chats..."
          className="text-on-surface placeholder:text-gray-medium/70 focus:border-on-surface/30 w-full rounded-lg border border-[rgba(0,0,0,0.06)] bg-white py-1.5 pr-8 pl-8 text-xs transition-all duration-200 focus:outline-none"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            className="text-gray-medium hover:text-on-surface absolute top-1/2 right-2.5 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex-grow space-y-1 overflow-y-auto pr-1">
        <div className="text-gray-medium flex items-center justify-between px-2 pb-2 text-[11px] font-medium tracking-wider uppercase">
          <span>
            {debouncedQuery ? "Search results" : "Recent conversations"}
          </span>
        </div>

        {isLoading ? (
          <RecentConversationsSkeleton />
        ) : !sessions || sessions.length === 0 ? (
          <div className="text-gray-medium rounded-lg border border-dashed border-[rgba(0,0,0,0.08)] px-3 py-4 text-center text-xs">
            {debouncedQuery ? "No matching conversations" : "No previous chats"}
          </div>
        ) : (
          <div className="space-y-0.5">
            <AnimatePresence initial={false}>
              {sessions.map((session: any) => {
                const sessionTitle =
                  session.title?.trim() ||
                  session.lastMessageContent?.trim() ||
                  "New Conversation";
                const isActive = activeSessionId === session.id;
                const isUnread = session.readStatus === "not read" && !isActive;
                const relativeTime = formatRelativeTime(
                  session.updatedAt || session.createdAt,
                );
                const isDeleting =
                  deleteSessionMutation.isPending &&
                  deleteSessionMutation.variables === session.id;

                return (
                  <Link
                    href={`/chat/${session.id}`}
                    scroll={false}
                    key={session.id}
                    onClick={(e) => {
                      if (isDeleting) {
                        e.preventDefault();
                        return;
                      }
                      onSelectSession(session.id);
                    }}
                    className={cn(
                      "group text-body-md relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-all duration-200",
                      isActive
                        ? "text-on-surface border border-[rgba(0,0,0,0.04)] bg-white font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                        : isUnread
                          ? "text-on-surface bg-surface-container/60 hover:bg-surface-container font-semibold"
                          : "text-gray-medium hover:bg-surface-container hover:text-on-surface",
                      isDeleting && "pointer-events-none opacity-60",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <History
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive || isUnread
                            ? "text-on-surface"
                            : "text-gray-medium group-hover:text-on-surface",
                        )}
                      />
                      <span className="font-body-md text-body-md truncate">
                        {sessionTitle}
                      </span>
                    </div>

                    <div
                      className="flex shrink-0 items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {relativeTime && !isDeleting && (
                        <span className="font-code-sm text-gray-medium/80 group-hover:text-gray-medium text-[10px] group-hover:hidden">
                          {relativeTime}
                        </span>
                      )}
                      {isUnread && !isDeleting && (
                        <span
                          title="Unread message"
                          className="bg-primary h-2 w-2 animate-pulse rounded-full group-hover:hidden"
                        />
                      )}

                      {/* Soft Delete Action Button with Loading State */}
                      <button
                        type="button"
                        disabled={deleteSessionMutation.isPending}
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        title="Delete conversation"
                        className={cn(
                          "text-gray-medium/70 hover:text-error hover:bg-error/10 rounded p-1 transition-colors",
                          isDeleting
                            ? "text-error block"
                            : "hidden group-hover:block",
                        )}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </Link>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-[rgba(0,0,0,0.06)] pt-4">
        <Link
          href="/settings"
          onClick={closeSidebar}
          className="text-body-md text-gray-medium hover:bg-surface-container hover:text-on-surface flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-colors duration-200"
        >
          <Settings className="h-4 w-4" />
          <span className="font-body-md text-body-md">Settings</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <nav className="bg-surface-container-low relative z-20 hidden h-dvh h-screen w-64 shrink-0 flex-col border-r border-[rgba(0,0,0,0.06)] md:flex">
        {sidebarContent}
      </nav>

      {/* Mobile drawer with slide-over overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeSidebar}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
            />
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-surface-container-low fixed inset-y-0 left-0 z-50 flex h-dvh h-full w-72 max-w-[85vw] flex-col border-r border-[rgba(0,0,0,0.08)] shadow-2xl md:hidden"
            >
              {sidebarContent}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, SquarePen, Search, X, AlertCircle } from "lucide-react";
import {
  useGetSessions,
  useDeleteSession,
} from "@/hooks/data/useChats/useChats";
import type { ChatSessionListItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { Logo } from "@/components/ui/logo";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BottomNav } from "@/components/modules/settings/BottomNav";
import { ChatSidebar } from "@/components/modules/chat/ChatSidebar";
import { ChatSessionActionsMenu } from "@/components/modules/chat/ChatSessionActionsMenu";
import { ShareChatModal } from "@/components/modules/chat/ShareChatModal";

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

function ChatsPageContent() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sessionToDelete, setSessionToDelete] =
    useState<ChatSessionListItem | null>(null);
  const [shareModalSession, setShareModalSession] =
    useState<ChatSessionListItem | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetSessions(debouncedQuery);
  const deleteSessionMutation = useDeleteSession();

  const sessions = useMemo(() => {
    if (!data?.pages) return [];
    const seen = new Set<string>();
    const unique: ChatSessionListItem[] = [];
    for (const page of data.pages) {
      if (!page?.items) continue;
      for (const session of page.items) {
        if (session?.id && !seen.has(session.id)) {
          seen.add(session.id);
          unique.push(session);
        }
      }
    }
    return unique;
  }, [data]);

  const handleSelectSession = (sessionId: string) => {
    router.push(`/chat/${sessionId}`);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      await deleteSessionMutation.mutateAsync(sessionToDelete.id);
      toast.success("Conversation deleted");
      setSessionToDelete(null);
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#FBFBFA] dark:bg-[#121214]">
      {/* Desktop Sidebar (visible on desktop) */}
      <ChatSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Main Window Area */}
      <main className="relative flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* ─── Desktop Gate: Centered Message (DESIGN.md Editorial Workspace) ─── */}
        <div className="hidden h-full w-full flex-col items-center justify-center p-6 text-center select-none md:flex">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#EAEAEA] bg-white shadow-2xs dark:border-white/10 dark:bg-[#18181b]">
            <MessageSquare className="h-6 w-6 stroke-[1.75px] text-[#787774] dark:text-neutral-400" />
          </div>
          <h2 className="text-base font-semibold tracking-tight text-[#111111] sm:text-lg dark:text-white">
            Select a chat to view or create one
          </h2>
          <p className="mt-1.5 max-w-sm text-xs text-[#787774] dark:text-neutral-400">
            Pick a conversation from the sidebar to continue, or start a fresh
            session.
          </p>
          <Link
            href="/chat"
            className="mt-5 inline-flex h-8.5 items-center gap-1.5 rounded-lg bg-[#111111] px-4 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-[#222222] active:scale-95 dark:bg-white dark:text-[#111111] dark:hover:bg-neutral-100"
          >
            <SquarePen className="h-3.5 w-3.5" />
            <span>New chat</span>
          </Link>
          <p className="mt-4 text-[11px] text-[#A1A1A0] dark:text-neutral-500">
            Press{" "}
            <kbd className="rounded border border-[#EAEAEA] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#787774] shadow-2xs dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-400">
              ⌘K
            </kbd>{" "}
            to search conversations
          </p>
        </div>

        {/* ─── Mobile Conversation Directory (md:hidden) ─── */}
        <div className="flex h-full w-full flex-col overflow-hidden md:hidden">
          {/* Header Bar */}
          <header className="sticky top-0 z-20 flex flex-col border-b border-[#EAEAEA] bg-white/80 px-4 pt-4 pb-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#18181b]/80">
            <div className="flex items-center justify-between gap-3">
              {/* Left: Icon Logo + Chats Title */}
              <div className="flex items-center gap-2.5">
                <Link
                  href="/chat"
                  className="flex items-center transition-opacity select-none hover:opacity-85"
                  aria-label="Cognito Chat home"
                >
                  <Logo
                    logoOnly
                    iconClassName="size-6 text-[#111111] dark:text-white"
                  />
                </Link>
                <span className="font-light text-neutral-300 select-none dark:text-neutral-700">
                  /
                </span>
                <h1 className="text-base font-semibold tracking-tight text-[#111111] dark:text-white">
                  Chats
                </h1>
              </div>

              {/* Right: New chat CTA */}
              <Link
                href="/chat"
                className="inline-flex h-8.5 items-center gap-1.5 rounded-full bg-[#111111] px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-[#222222] active:scale-95 dark:bg-white dark:text-[#111111] dark:hover:bg-neutral-100"
              >
                <SquarePen className="h-3.5 w-3.5" />
                <span>New chat</span>
              </Link>
            </div>

            {/* Search Filter */}
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#787774]" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-[#EAEAEA] bg-white pr-8 pl-8.5 text-xs text-[#111111] shadow-2xs transition-colors placeholder:text-[#787774] focus:border-[#111111] focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 p-0.5 text-[#787774] hover:text-[#111111] dark:hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </header>

          {/* Conversation List / Infinite Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-3 pb-28">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-[#EAEAEA] bg-white p-3.5 dark:border-white/10 dark:bg-[#18181b]"
                  >
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/5 rounded" />
                      <Skeleton className="h-3 w-2/5 rounded" />
                    </div>
                    <Skeleton className="ml-4 h-3 w-12 rounded" />
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="mx-auto flex max-w-sm flex-col items-center justify-center px-4 py-20 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-[#787774] dark:bg-neutral-800">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h2 className="text-sm font-semibold text-[#111111] dark:text-white">
                  {searchQuery
                    ? "No matching conversations"
                    : "No conversations yet"}
                </h2>
                <p className="mt-1 text-xs text-[#787774] dark:text-neutral-400">
                  {searchQuery
                    ? "Try searching for a different keyword or topic"
                    : "Start a conversation to see your history preserved here"}
                </p>
                {!searchQuery && (
                  <Link
                    href="/chat"
                    className="mt-4 inline-flex h-8.5 items-center gap-1.5 rounded-lg bg-[#111111] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#222222] dark:bg-white dark:text-[#111111]"
                  >
                    <SquarePen className="h-3.5 w-3.5" />
                    <span>Start your first chat</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {sessions.map((session) => {
                  const title =
                    session.title?.trim() ||
                    session.lastMessageContent?.trim() ||
                    "New Conversation";
                  const snippet =
                    session.lastMessageContent &&
                    session.lastMessageContent !== session.title
                      ? session.lastMessageContent.trim()
                      : "";
                  const relativeTime = formatRelativeTime(
                    session.updatedAt || session.createdAt,
                  );
                  const isUnread = session.readStatus === "not read";

                  return (
                    <div
                      key={session.id}
                      className="group relative flex items-center justify-between gap-3 rounded-2xl border border-[#EAEAEA] bg-white p-3.5 shadow-2xs transition-all hover:border-neutral-300 hover:shadow-xs active:scale-[0.99] dark:border-white/10 dark:bg-[#18181b] dark:hover:border-white/20"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectSession(session.id)}
                        className="flex min-w-0 flex-1 cursor-pointer flex-col text-left"
                      >
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#1F6C9F]" />
                          )}
                          <span className="truncate text-xs font-semibold text-[#111111] sm:text-sm dark:text-white">
                            {title}
                          </span>
                        </div>
                        {snippet && (
                          <p className="mt-1 line-clamp-1 text-xs text-[#787774] dark:text-neutral-400">
                            {snippet}
                          </p>
                        )}
                        <span className="mt-1 text-[11px] text-[#A1A1A0] dark:text-neutral-500">
                          {relativeTime}
                        </span>
                      </button>

                      {/* Ellipsis actions menu with Share and Delete */}
                      <div
                        className="flex shrink-0 items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ChatSessionActionsMenu
                          variant="header"
                          isDeleting={
                            deleteSessionMutation.isPending &&
                            sessionToDelete?.id === session.id
                          }
                          onShare={() => setShareModalSession(session)}
                          onDelete={() => setSessionToDelete(session)}
                          triggerClassName="size-8 text-[#787774] hover:text-[#111111] hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Infinite Scroll trigger */}
                {!searchQuery && (
                  <div className="pt-2">
                    <InfiniteScroll
                      hasNextPage={hasNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                      fetchNextPage={fetchNextPage}
                      endMessage={
                        data?.pages && data.pages.length > 1
                          ? "You're all caught up"
                          : undefined
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Floating Bottom Navigation Bar (Mobile only) */}
          <BottomNav />
        </div>
      </main>

      {/* Share Chat Modal */}
      <ShareChatModal
        sessionId={shareModalSession?.id ?? null}
        sessionTitle={shareModalSession?.title}
        shareId={
          shareModalSession
            ? (sessions.find((s) => s.id === shareModalSession.id)?.shareId ??
              shareModalSession.shareId)
            : undefined
        }
        open={Boolean(shareModalSession)}
        onOpenChange={(open) => !open && setShareModalSession(null)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(sessionToDelete)}
        onOpenChange={(open) => !open && setSessionToDelete(null)}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50">
              <AlertCircle className="h-4 w-4" />
            </div>
            <DialogTitle className="text-sm font-semibold text-[#111111] dark:text-white">
              Delete conversation?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#787774] dark:text-neutral-400">
              &quot;{sessionToDelete?.title || "This conversation"}&quot; will
              be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSessionToDelete(null)}
              className="h-8 flex-1 rounded-md text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              disabled={deleteSessionMutation.isPending}
              className="h-8 flex-1 rounded-md bg-red-600 text-xs font-semibold text-white hover:bg-red-700"
            >
              {deleteSessionMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex h-full items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      }
    >
      <ChatsPageContent />
    </Suspense>
  );
}

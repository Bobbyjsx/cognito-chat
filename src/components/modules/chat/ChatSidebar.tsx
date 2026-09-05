"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  History,
  Loader2,
  Search,
  Settings,
  X,
  Image as ImageIcon,
  PanelLeftClose,
  PanelLeft,
  SquarePen,
} from "lucide-react";
import { ShareChatModal } from "./ShareChatModal";
import { ChatSessionActionsMenu } from "./ChatSessionActionsMenu";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatSessionListItem } from "@/types";
import { toast } from "@/components/ui/toast";
import { Logo } from "@/components/ui/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Skeleton } from "@/components/ui/skeleton";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useDeleteSession,
  useGetSessions,
  useMarkSessionRead,
} from "@/hooks/data/useChats/useChats";
import { cn } from "@/lib/utils";
import { GlobalSearchModal, type PaletteTab } from "./GlobalSearchModal";

interface ChatSidebarProps {
  activeSessionId?: string | null;
  onSelectSession?: (id: string) => void;
  onNewChat?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  activeModel?: string;
  onSelectModel?: (model: string) => void;
  activeReasoning?: string;
  onSelectReasoning?: (reasoning: string) => void;
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
            <Skeleton className="h-4 w-4 shrink-0 rounded" />
            <Skeleton className={cn("h-3.5 rounded", wClass)} />
          </div>
          <Skeleton className="h-3 w-8 shrink-0 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ChatSidebar({
  activeSessionId = null,
  onSelectSession,
  onNewChat,
  open = false,
  onOpenChange,
  activeModel,
  onSelectModel,
  activeReasoning,
  onSelectReasoning,
}: ChatSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchDefaultTab, setSearchDefaultTab] = useState<PaletteTab>("all");
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [shareModalSession, setShareModalSession] = useState<{
    id: string;
    title?: string | null;
    shareId?: string | null;
  } | null>(null);

  // Global shortcut for Cmd+K / Ctrl+K (opens in 'all' tab)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchDefaultTab("all");
        setSearchModalOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetSessions("");
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
  const deleteSessionMutation = useDeleteSession();
  const { mutate: markSessionRead } = useMarkSessionRead();

  // Mark the active session as read if it is unread
  useEffect(() => {
    if (!activeSessionId) return;
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (activeSession && activeSession.readStatus === "not read") {
      markSessionRead(activeSessionId);
    }
  }, [activeSessionId, sessions, markSessionRead]);

  const handleDeleteSession = (sessionId: string) => {
    deleteSessionMutation.mutate(sessionId, {
      onSuccess: () => {
        toast.success("Conversation deleted");
        if (activeSessionId === sessionId) {
          onNewChat?.();
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

  // ─── Collapsed rail (icon-only) ────────────────────────────────────────────
  const collapsedContent = (
    <div className="flex h-full w-full flex-col items-center gap-1 py-3">
      {/* Logo */}
      <div className="mb-2 flex items-center justify-center">
        <Link
          href="/chat"
          scroll={false}
          onClick={() => {
            onNewChat?.();
            closeSidebar();
          }}
          aria-label="Go to chat"
        >
          <Logo logoOnly />
        </Link>
      </div>

      {/* Top actions */}
      <IconTooltipButton
        label="New chat"
        side="right"
        onClick={() => {
          onNewChat?.();
          router.push("/chat");
          closeSidebar();
        }}
      >
        <SquarePen className="h-5 w-5" />
      </IconTooltipButton>

      <IconTooltipButton
        label="Search"
        shortcut="⌘K"
        side="right"
        onClick={() => {
          setSearchDefaultTab("chats");
          setSearchModalOpen(true);
        }}
      >
        <Search className="h-5 w-5" />
      </IconTooltipButton>

      <IconTooltipButton
        label="Library"
        side="right"
        onClick={() => router.push("/library")}
        className={cn(
          pathname.startsWith("/library") && "bg-muted text-foreground",
        )}
      >
        <ImageIcon className="h-5 w-5" />
      </IconTooltipButton>

      {/* Expand */}
      <div className="mt-auto flex flex-col items-center gap-1 pb-1">
        <IconTooltipButton
          label="Settings"
          side="right"
          onClick={() => router.push("/settings")}
          className={cn(pathname === "/settings" && "bg-muted text-foreground")}
        >
          <Settings className="h-5 w-5" />
        </IconTooltipButton>

        <IconTooltipButton
          label="Expand sidebar"
          side="right"
          onClick={() => setIsDesktopOpen(true)}
        >
          <PanelLeft className="h-5 w-5" />
        </IconTooltipButton>
      </div>
    </div>
  );

  return (
    <>
      <GlobalSearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        defaultTab={searchDefaultTab}
        activeSessionId={activeSessionId}
        activeModel={activeModel}
        onSelectModel={onSelectModel}
        activeReasoning={activeReasoning}
        onSelectReasoning={onSelectReasoning}
        onNewChat={onNewChat}
      />

      {/* Desktop fixed sidebar */}
      <nav
        className={cn(
          "bg-sidebar border-border relative z-20 hidden h-dvh shrink-0 flex-col border-r transition-[width] duration-300 ease-in-out md:flex",
          isDesktopOpen ? "w-64" : "w-[60px]",
        )}
      >
        {isDesktopOpen ? (
          <SidebarExpandedContent
            sessions={sessions}
            isLoading={isLoading}
            activeSessionId={activeSessionId}
            onSelectSession={onSelectSession}
            onNewChat={onNewChat}
            closeSidebar={closeSidebar}
            onOpenSearch={() => {
              setSearchDefaultTab("chats");
              setSearchModalOpen(true);
            }}
            pathname={pathname}
            router={router}
            isDeletingSessionId={
              deleteSessionMutation.isPending
                ? (deleteSessionMutation.variables ?? null)
                : null
            }
            isAnyDeleting={deleteSessionMutation.isPending}
            onDeleteSession={handleDeleteSession}
            onShareSession={setShareModalSession}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            dataPagesLength={data?.pages?.length}
            onCollapseDesktop={() => setIsDesktopOpen(false)}
          />
        ) : (
          collapsedContent
        )}
      </nav>

      {/* Mobile slide-over */}
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
              className="bg-sidebar border-border fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col border-r shadow-2xl md:hidden"
            >
              <SidebarExpandedContent
                isMobile
                sessions={sessions}
                isLoading={isLoading}
                activeSessionId={activeSessionId}
                onSelectSession={onSelectSession}
                onNewChat={onNewChat}
                closeSidebar={closeSidebar}
                onOpenSearch={() => {
                  setSearchDefaultTab("chats");
                  setSearchModalOpen(true);
                }}
                pathname={pathname}
                router={router}
                isDeletingSessionId={
                  deleteSessionMutation.isPending
                    ? (deleteSessionMutation.variables ?? null)
                    : null
                }
                isAnyDeleting={deleteSessionMutation.isPending}
                onDeleteSession={handleDeleteSession}
                onShareSession={setShareModalSession}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                dataPagesLength={data?.pages?.length}
              />
            </motion.nav>
          </>
        )}
      </AnimatePresence>

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
    </>
  );
}

interface SidebarExpandedContentProps {
  isMobile?: boolean;
  sessions: ChatSessionListItem[];
  isLoading: boolean;
  activeSessionId: string | null;
  onSelectSession?: (id: string) => void;
  onNewChat?: () => void;
  closeSidebar: () => void;
  onOpenSearch: () => void;
  pathname: string;
  router: ReturnType<typeof useRouter>;
  isDeletingSessionId: string | null;
  isAnyDeleting: boolean;
  onDeleteSession: (sessionId: string) => void;
  onShareSession: (session: {
    id: string;
    title?: string | null;
    shareId?: string | null;
  }) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  dataPagesLength?: number;
  onCollapseDesktop?: () => void;
}

function SidebarExpandedContent({
  isMobile = false,
  sessions,
  isLoading,
  activeSessionId,
  onSelectSession,
  onNewChat,
  closeSidebar,
  onOpenSearch,
  pathname,
  router,
  isDeletingSessionId,
  isAnyDeleting,
  onDeleteSession,
  onShareSession,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  dataPagesLength,
  onCollapseDesktop,
}: SidebarExpandedContentProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeSessionId) return;

    let attempts = 0;
    let raf = 0;

    const tryScroll = () => {
      const container = listRef.current;
      const row = container?.querySelector<HTMLElement>(
        `a[data-session-id="${activeSessionId}"]`,
      );
      if (container && row) {
        const cRect = container.getBoundingClientRect();
        const rRect = row.getBoundingClientRect();
        if (rRect.top >= cRect.top && rRect.bottom <= cRect.bottom) return;
        const padding = 16;
        container.scrollTo({
          top:
            container.scrollTop +
            (rRect.top < cRect.top
              ? rRect.top - cRect.top - padding
              : rRect.bottom - cRect.bottom + padding),
          behavior: "auto",
        });
      }
      if (attempts++ < 60) raf = requestAnimationFrame(tryScroll);
    };

    tryScroll();
    return () => cancelAnimationFrame(raf);
  }, [activeSessionId]);

  const rowVirtualizer = useVirtualizer({
    count: sessions.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 42,
    overscan: 10,
    getItemKey: (index) => sessions[index]?.id ?? index,
  });

  return (
    <div className="flex h-full w-full flex-col px-3 py-3">
      {/* Header row: logo + actions */}
      <div className="mb-2 flex items-center justify-between px-1">
        <Link
          href="/chat"
          scroll={false}
          onClick={() => {
            onNewChat?.();
            closeSidebar();
          }}
          className="flex items-center"
        >
          <Logo />
        </Link>

        <div className="flex items-center gap-0.5">
          <IconTooltipButton
            label="Search"
            shortcut="⌘K"
            side="bottom"
            onClick={onOpenSearch}
          >
            <Search className="h-4 w-4" />
          </IconTooltipButton>

          {/* Mobile: close */}
          {isMobile && (
            <IconTooltipButton
              label="Close sidebar"
              side="bottom"
              className="md:hidden"
              onClick={closeSidebar}
            >
              <X className="h-4 w-4" />
            </IconTooltipButton>
          )}
        </div>
      </div>

      {/* New chat button */}
      <div className="mb-3 px-1">
        <Button
          variant="ghost"
          onClick={() => {
            onNewChat?.();
            router.push("/chat");
            closeSidebar();
          }}
          className="text-muted-foreground hover:text-foreground w-full justify-start gap-2.5 font-medium"
          aria-label="New Chat"
        >
          <SquarePen className="h-4 w-4 shrink-0" />
          New chat
        </Button>
      </div>

      {/* Nav links */}
      <div className="mb-4 space-y-0.5 px-1">
        <Link
          href="/library"
          scroll={false}
          onClick={closeSidebar}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full justify-start gap-2.5 font-medium",
            pathname.startsWith("/library")
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground",
          )}
        >
          <ImageIcon className="h-4 w-4 shrink-0" />
          Library
        </Link>
      </div>

      {/* Section label */}
      <div className="mb-1 px-2">
        <span className="text-muted-foreground/60 text-[10px] font-semibold tracking-widest uppercase">
          Recent
        </span>
      </div>

      {/* Session list */}
      <div
        ref={listRef}
        data-sidebar-session-list
        className="flex-1 overflow-y-auto pr-0.5"
      >
        {isLoading ? (
          <RecentConversationsSkeleton />
        ) : !sessions || sessions.length === 0 ? (
          <div className="text-gray-medium rounded-lg border border-dashed border-[rgba(0,0,0,0.08)] px-3 py-4 text-center text-xs">
            No previous chats
          </div>
        ) : (
          <div
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const session = sessions[virtualItem.index];
              if (!session) return null;
              const idx = virtualItem.index;
              const isActive = activeSessionId === session.id;
              const isDeleting = isDeletingSessionId === session.id;

              return (
                <SidebarSessionItem
                  key={virtualItem.key}
                  session={session}
                  idx={idx}
                  virtualItem={virtualItem}
                  isActive={isActive}
                  isDeleting={isDeleting}
                  isAnyDeleting={isAnyDeleting}
                  closeSidebar={closeSidebar}
                  onSelectSession={onSelectSession}
                  onShareSession={onShareSession}
                  onDeleteSession={onDeleteSession}
                />
              );
            })}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${rowVirtualizer.getTotalSize()}px)`,
              }}
            >
              <InfiniteScroll
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                endMessage={
                  dataPagesLength && dataPagesLength > 1
                    ? "You're all caught up"
                    : ""
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-border mt-auto flex items-center justify-between border-t pt-2">
        <Link
          href="/settings"
          onClick={closeSidebar}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "flex-1 justify-start gap-2.5 font-medium",
            pathname === "/settings"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground",
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>

        {/* Desktop: collapse */}
        {!isMobile && onCollapseDesktop && (
          <IconTooltipButton
            label="Collapse sidebar"
            side="top"
            className="text-muted-foreground hover:text-foreground hidden shrink-0 md:inline-flex"
            onClick={onCollapseDesktop}
          >
            <PanelLeftClose className="h-4 w-4" />
          </IconTooltipButton>
        )}
      </div>
    </div>
  );
}

function TypewriterTitle({
  text,
  animate = false,
  speed = 28,
  className,
}: {
  text: string;
  animate?: boolean;
  speed?: number;
  className?: string;
}) {
  const [charCount, setCharCount] = useState(animate ? 0 : text.length);

  useEffect(() => {
    if (!animate) return;

    const interval = setInterval(() => {
      setCharCount((prev) => {
        if (prev < text.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, animate, speed]);

  const displayedText = animate ? text.slice(0, charCount) : text;
  const isTyping = animate && charCount < text.length;

  return (
    <span className={className}>
      {displayedText}
      {isTyping && (
        <span className="text-primary/70 ml-0.5 inline-block animate-pulse font-mono text-[10px] leading-none">
          ▌
        </span>
      )}
    </span>
  );
}

function SidebarSessionItem({
  session,
  idx,
  virtualItem,
  isActive,
  isDeleting,
  isAnyDeleting,
  closeSidebar,
  onSelectSession,
  onShareSession,
  onDeleteSession,
}: {
  session: ChatSessionListItem;
  idx: number;
  virtualItem: { key: React.Key; size: number; start: number };
  isActive: boolean;
  isDeleting: boolean;
  isAnyDeleting: boolean;
  closeSidebar: () => void;
  onSelectSession?: (id: string) => void;
  onShareSession: (session: {
    id: string;
    title?: string | null;
    shareId?: string | null;
  }) => void;
  onDeleteSession: (sessionId: string) => void;
}) {
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const sessionTitle =
    session.title?.trim() ||
    session.lastMessageContent?.trim() ||
    "New Conversation";
  const isUnread = session.readStatus === "not read" && !isActive;
  const relativeTime = formatRelativeTime(
    session.updatedAt || session.createdAt,
  );

  return (
    <div
      className="absolute top-0 left-0 w-full px-0.5 py-0.5"
      style={{
        height: `${virtualItem.size}px`,
        transform: `translateY(${virtualItem.start}px)`,
      }}
    >
      <div
        className={cn(
          "group relative flex h-full w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-all duration-150",
          isActive
            ? "bg-muted text-foreground font-medium"
            : isUnread
              ? "text-foreground bg-muted/60 font-medium"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          isDeleting && "pointer-events-none opacity-60",
        )}
      >
        <Link
          href={`/chat/${session.id}`}
          scroll={false}
          data-session-id={session.id}
          prefetch={idx <= 5}
          onClick={(e) => {
            if (isDeleting || session.id.startsWith("optimistic-")) {
              e.preventDefault();
              return;
            }
            closeSidebar();
            setTimeout(() => onSelectSession?.(session.id), 0);
          }}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 outline-none"
        >
          {session.activeGenerationId ||
          session.id.startsWith("optimistic-") ? (
            <Loader2
              className={cn(
                "h-3.5 w-3.5 shrink-0 animate-spin transition-colors",
                "text-primary",
              )}
            />
          ) : (
            <History
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-colors",
                isActive || isUnread
                  ? "text-foreground"
                  : "text-muted-foreground/60 group-hover:text-muted-foreground",
              )}
            />
          )}
          <TypewriterTitle
            text={sessionTitle}
            animate={Boolean(session.animateTitle)}
            className="truncate text-[13px]"
          />
        </Link>

        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
        >
          {relativeTime && !isDeleting && !isActionsMenuOpen && (
            <span className="text-muted-foreground/50 text-[10px] md:group-hover:hidden">
              {relativeTime}
            </span>
          )}
          {isUnread && !isDeleting && !isActionsMenuOpen && (
            <span
              title="Unread message"
              className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full md:group-hover:hidden"
            />
          )}

          <div
            className={cn(
              isDeleting || isActionsMenuOpen
                ? "block"
                : "block md:hidden md:group-hover:block [@media(hover:none)]:block",
            )}
          >
            <ChatSessionActionsMenu
              open={isActionsMenuOpen}
              onOpenChange={setIsActionsMenuOpen}
              isDeleting={isDeleting}
              disabled={isAnyDeleting && !isDeleting}
              onShare={() =>
                onShareSession({
                  id: session.id,
                  title: sessionTitle,
                  shareId: session.shareId,
                })
              }
              onDelete={() => onDeleteSession(session.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

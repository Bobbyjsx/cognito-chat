"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SquarePen, ChevronLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ChatSessionActionsMenu } from "./ChatSessionActionsMenu";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onBackClick?: () => void;
  onMenuClick?: () => void;
  onNewChat?: () => void;
  onShareClick?: () => void;
  onDeleteClick?: () => void;
  isDeleting?: boolean;
}

export function Navbar({
  onBackClick,
  onMenuClick: _onMenuClick,
  onNewChat,
  onShareClick,
  onDeleteClick,
  isDeleting = false,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isChatWindow = pathname === "/chat" || pathname.startsWith("/chat/");

  const handleNewChatClick = () => {
    if (onNewChat) {
      onNewChat();
    }
    router.push("/chat");
  };

  // Active session = pen + ellipsis are visible
  const hasActiveSession = !!(onNewChat || onShareClick || onDeleteClick);

  // In active chat window: render the floating liquid glass < Chats button, Logo, and actions
  if (isChatWindow || onBackClick) {
    return (
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
        {/* Floating Liquid Glass < Chats Button */}
        <Link
          href="/chats"
          onClick={(e) => {
            if (onBackClick) {
              e.preventDefault();
              onBackClick();
            }
          }}
          className={cn(
            "group pointer-events-auto relative inline-flex h-9 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold select-none",
            "border border-white/80 bg-white/75 text-neutral-900 shadow-[0_4px_20px_rgba(0,0,0,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.04)]",
            "backdrop-blur-2xl backdrop-saturate-180 transition-all duration-200 active:scale-95",
            "dark:border-white/15 dark:bg-[#18181b]/75 dark:text-neutral-100 dark:shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.2),inset_0_-1px_1px_rgba(0,0,0,0.4)]",
            "before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent dark:before:via-white/30",
          )}
          aria-label="Back to all chats"
        >
          <ChevronLeft className="-ml-1 h-4 w-4 stroke-[2.5px] text-neutral-800 transition-transform group-active:-translate-x-0.5 dark:text-neutral-200" />
          <span>Chats</span>
        </Link>

        {/* Center: Icon-only logo — only shown when in an active chat session */}
        {hasActiveSession && (
          <Link
            href="/chat"
            className={cn(
              "pointer-events-auto absolute left-1/2 flex h-9 w-9 shrink-0 -translate-x-1/2 items-center justify-center rounded-full select-none",
              "border border-white/80 bg-white/75 text-neutral-800 shadow-[0_4px_20px_rgba(0,0,0,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.04)]",
              "backdrop-blur-2xl backdrop-saturate-180 transition-all duration-200 active:scale-95",
              "hover:bg-white/90 dark:border-white/15 dark:bg-[#18181b]/75 dark:text-neutral-200 dark:shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.2),inset_0_-1px_1px_rgba(0,0,0,0.4)] dark:hover:bg-[#18181b]/90",
            )}
            aria-label="Cognito Chat home"
          >
            <Logo
              logoOnly={true}
              iconClassName="size-5 text-[#111111] dark:text-white"
            />
          </Link>
        )}

        {/* Right: Action cluster + full logo (new chat only) */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {onNewChat && (
            <button
              type="button"
              onClick={handleNewChatClick}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full select-none",
                "border border-white/80 bg-white/75 text-neutral-800 shadow-[0_4px_20px_rgba(0,0,0,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.04)]",
                "backdrop-blur-2xl backdrop-saturate-180 transition-all duration-200 active:scale-95",
                "hover:bg-white/90 dark:border-white/15 dark:bg-[#18181b]/75 dark:text-neutral-200 dark:shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.2),inset_0_-1px_1px_rgba(0,0,0,0.4)] dark:hover:bg-[#18181b]/90",
              )}
              title="New Chat"
              aria-label="New Chat"
            >
              <SquarePen className="h-4 w-4 stroke-[2px]" />
            </button>
          )}
          {onShareClick && onDeleteClick && (
            <ChatSessionActionsMenu
              variant="header"
              isDeleting={isDeleting}
              onShare={onShareClick}
              onDelete={onDeleteClick}
              triggerClassName={cn(
                "flex h-9 w-9 items-center justify-center rounded-full select-none",
                "border border-white/80 bg-white/75 text-neutral-800 shadow-[0_4px_20px_rgba(0,0,0,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.04)]",
                "backdrop-blur-2xl backdrop-saturate-180 transition-all duration-200 active:scale-95",
                "hover:bg-white/90 dark:border-white/15 dark:bg-[#18181b]/75 dark:text-neutral-200 dark:shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.2),inset_0_-1px_1px_rgba(0,0,0,0.4)] dark:hover:bg-[#18181b]/90",
              )}
            />
          )}

          {/* Far Right: Full logo — only on new chat (no active session) */}
          {!hasActiveSession && (
            <Link
              href="/chat"
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-full px-3 select-none",
                "border border-white/80 bg-white/75 text-neutral-800 shadow-[0_4px_20px_rgba(0,0,0,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.04)]",
                "backdrop-blur-2xl backdrop-saturate-180 transition-all duration-200 active:scale-95",
                "hover:bg-white/90 dark:border-white/15 dark:bg-[#18181b]/75 dark:text-neutral-200 dark:shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.2),inset_0_-1px_1px_rgba(0,0,0,0.4)] dark:hover:bg-[#18181b]/90",
              )}
              aria-label="Cognito Chat home"
            >
              <Logo
                logoOnly={false}
                iconClassName="size-5 text-[#111111] dark:text-white"
                textClassName="text-xs font-semibold tracking-tight text-[#111111] dark:text-white"
              />
            </Link>
          )}
        </div>
      </header>
    );
  }

  // Fallback for non-chat pages (e.g. settings/billing if mounted)
  return (
    <header className="bg-surface/90 sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-[rgba(0,0,0,0.06)] px-3 backdrop-blur-xl sm:px-4 md:hidden dark:border-white/10 dark:bg-[#18181b]/90">
      <div className="flex min-w-0 items-center gap-1.5">
        <Logo />
      </div>
    </header>
  );
}

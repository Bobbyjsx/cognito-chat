"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, SquarePen } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Spinner } from "@/components/ui/spinner";
import { ChatSessionActionsMenu } from "./ChatSessionActionsMenu";

interface NavbarProps {
  onMenuClick?: () => void;
  onNewChat?: () => void;
  onShareClick?: () => void;
  onDeleteClick?: () => void;
  isDeleting?: boolean;
}

export function Navbar({
  onMenuClick,
  onNewChat,
  onShareClick,
  onDeleteClick,
  isDeleting = false,
}: NavbarProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } catch {
      setIsSigningOut(false);
    }
  };

  const handleNewChatClick = () => {
    if (onNewChat) {
      onNewChat();
    }
    router.push("/chat");
  };

  return (
    <header className="bg-surface/90 sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-[rgba(0,0,0,0.06)] px-3 backdrop-blur-xl sm:px-4 md:hidden">
      <div className="flex min-w-0 items-center gap-1.5">
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="text-gray-medium hover:text-on-surface hover:bg-surface-container rounded-lg p-2 transition-colors duration-200"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}
        <Logo />
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {onShareClick && onDeleteClick && (
          <ChatSessionActionsMenu
            variant="header"
            isDeleting={isDeleting}
            onShare={onShareClick}
            onDelete={onDeleteClick}
            triggerClassName="text-gray-medium hover:text-on-surface hover:bg-surface-container size-9"
          />
        )}
        {onNewChat && (
          <button
            type="button"
            onClick={handleNewChatClick}
            className="text-gray-medium hover:text-on-surface hover:bg-surface-container rounded-lg p-2 transition-colors duration-200"
            title="New Chat"
            aria-label="New Chat"
          >
            <SquarePen className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          title="Sign Out"
          className="text-gray-medium hover:text-error hover:bg-surface-container rounded-lg p-2 transition-colors duration-200 disabled:opacity-60"
        >
          {isSigningOut ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}

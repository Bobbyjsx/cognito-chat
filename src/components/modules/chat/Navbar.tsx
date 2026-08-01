"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu, Share } from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
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
        <button
          type="button"
          className="text-gray-medium hover:text-on-surface hover:bg-surface-container rounded-lg p-2 transition-colors duration-200"
          title="Share"
        >
          <Share className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign Out"
          className="text-gray-medium hover:text-error hover:bg-surface-container rounded-lg p-2 transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

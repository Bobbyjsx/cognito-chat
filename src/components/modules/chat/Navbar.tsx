"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu, Share } from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="md:hidden flex justify-between items-center h-14 px-3 sm:px-4 w-full sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-[rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-1.5 min-w-0">
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 rounded-lg text-gray-medium hover:text-on-surface hover:bg-surface-container transition-colors duration-200"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}
        <Logo />
      </div>
      <div className="flex gap-1 sm:gap-2 items-center shrink-0">
        <button
          type="button"
          className="p-2 rounded-lg text-gray-medium hover:text-on-surface hover:bg-surface-container transition-colors duration-200"
          title="Share"
        >
          <Share className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign Out"
          className="p-2 rounded-lg text-gray-medium hover:text-error hover:bg-surface-container transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

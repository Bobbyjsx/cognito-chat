"use client";

import { signOut, useSession } from "next-auth/react";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bot, LogOut, Zap } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const { data: profile } = useProfile();
  const { data: config } = useGetConfig();

  const userEmail = profile?.email || session?.user?.email || "User";
  const tokensUsed6h = profile?.tokensUsed6h ?? profile?.tokensUsed ?? 0;
  const tokenLimit6h = profile?.tokenLimit6h ?? profile?.tokenLimit ?? 60000;
  const activeDefaultModel = config?.defaultTextModel || "gemini-3.6-flash";

  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 md:px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/20">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-1.5">
            Cognito-Chat
            <Badge variant="default" className="text-[10px] py-0 px-1.5 font-normal">
              v1.0
            </Badge>
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Default: <span className="text-indigo-400 font-mono">{activeDefaultModel}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Token status pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
          <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span>
            <strong className="text-white font-semibold">{tokensUsed6h.toLocaleString()}</strong> / {tokenLimit6h.toLocaleString()} tokens (6h)
          </span>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2 border-l border-slate-800/80 pl-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-slate-300 hidden md:block max-w-[140px] truncate">
            {userEmail}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

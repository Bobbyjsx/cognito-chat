"use client";

import { useGetSessions } from "@/hooks/data/useChats/useChats";
import { TokenUsageCard } from "./TokenUsageCard";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";

interface ChatSidebarProps {
  activeSessionId: string | null;
  onSelectSession: (id: string | null) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  activeSessionId,
  onSelectSession,
  onNewChat,
}: ChatSidebarProps) {
  const { data: sessions, isLoading } = useGetSessions();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800/80 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl">
      {/* New Chat Button */}
      <Button
        onClick={onNewChat}
        className="w-full justify-start gap-2 shadow-lg mb-4"
        variant="default"
      >
        <Plus className="h-4 w-4" />
        New Chat
      </Button>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Recent Conversations
        </div>

        {isLoading ? (
          <div className="p-4 text-xs text-slate-500 animate-pulse">Loading sessions...</div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="p-4 text-xs text-slate-500 text-center border border-dashed border-slate-800 rounded-xl">
            No previous chats
          </div>
        ) : (
          sessions.map((session) => {
            const firstUserMessage =
              session.messages.find((m) => m.role === "user")?.content ||
              "New Conversation";
            const isActive = activeSessionId === session.id;

            return (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white border border-indigo-500/30 font-medium"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                <span className="truncate flex-1">{firstUserMessage}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Token usage card footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <TokenUsageCard />
      </div>
    </aside>
  );
}

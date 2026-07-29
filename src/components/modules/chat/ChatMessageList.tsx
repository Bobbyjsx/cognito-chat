"use client";

import { useEffect, useRef } from "react";
import { MessageSchema } from "@/types";
import { ChatMessageItem } from "./ChatMessageItem";
import { Bot, Sparkles } from "lucide-react";

interface ChatMessageListProps {
  messages: MessageSchema[];
  isLoading?: boolean;
}

export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-4 text-indigo-400">
          <Bot className="h-8 w-8 animate-bounce" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">How can I assist you today?</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Ask me anything! I am powered by Google Antigravity SDK with Firestore context memory and session tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-3 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-slate-800">
      {messages.map((msg, index) => (
        <ChatMessageItem key={index} message={msg} />
      ))}

      {isLoading && (
        <div className="flex items-center gap-3 text-sm text-slate-400 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/30 border border-purple-500/30 text-purple-300">
            <Sparkles className="h-4 w-4 animate-spin" />
          </div>
          <span className="animate-pulse">Thinking & generating response...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

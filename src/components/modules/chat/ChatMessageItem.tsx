"use client";

import { MessageSchema } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

interface ChatMessageItemProps {
  message: MessageSchema;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3.5 ${
        isUser ? "flex-row-reverse" : "flex-row"
      } w-full py-2`}
    >
      {/* Avatar */}
      <Avatar className={`h-8 w-8 shrink-0 ${isUser ? "bg-indigo-600/40 border-indigo-500/30" : "bg-purple-600/30 border-purple-500/30"}`}>
        <AvatarFallback className={isUser ? "bg-indigo-600/30 text-indigo-300" : "bg-purple-600/30 text-purple-300"}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Bubble */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/15 rounded-tr-xs"
            : "bg-slate-900/90 text-slate-100 border border-slate-800/80 shadow-md backdrop-blur-md rounded-tl-xs"
        }`}
      >
        <div className="font-semibold text-[11px] opacity-75 mb-1 flex items-center gap-1">
          {isUser ? "You" : "Cognito-Chat Agent"}
        </div>
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    </div>
  );
}

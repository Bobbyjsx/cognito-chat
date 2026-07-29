"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizontal, Sparkles, Loader2 } from "lucide-react";
import { ModelSelector } from "./ModelSelector";

interface ChatInputProps {
  onSend: (message: string, model?: string, reasoning?: string) => void;
  isLoading: boolean;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  selectedReasoning: string;
  onSelectReasoning: (reasoning: string) => void;
}

const QUICK_PROMPTS = [
  "Explain quantum computing in simple terms",
  "Write a Python script for fast data parsing",
  "Summarize the latest AI advancements",
];

export function ChatInput({
  onSend,
  isLoading,
  selectedModel,
  onSelectModel,
  selectedReasoning,
  onSelectReasoning,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    onSend(message.trim(), selectedModel, selectedReasoning);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-800/80 bg-slate-950/80 p-4 backdrop-blur-xl space-y-3">
      {/* Model & Reasoning selector bar */}
      <ModelSelector
        selectedModel={selectedModel}
        onSelectModel={onSelectModel}
        selectedReasoning={selectedReasoning}
        onSelectReasoning={onSelectReasoning}
      />

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSend(prompt, selectedModel, selectedReasoning)}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-400 hover:border-indigo-500/50 hover:bg-slate-800/80 hover:text-slate-200 transition-all duration-200 disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Cognito-Chat anything..."
          disabled={isLoading}
          className="flex-1 bg-slate-900/90 border-slate-800 focus-visible:ring-indigo-500/30"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          size="icon"
          className="h-11 w-11 rounded-xl shrink-0 bg-indigo-600 hover:bg-indigo-500"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <SendHorizontal className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

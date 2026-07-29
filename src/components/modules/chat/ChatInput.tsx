"use client";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Suggestion,
  Suggestions,
} from "@/components/ai-elements/suggestion";
import type { ChatStatus } from "ai";
import { ModelSelector } from "./ModelSelector";
import { DonutQuotaIndicator } from "./DonutQuotaIndicator";

interface ChatInputProps {
  onSend: (message: string, model?: string, reasoning?: string) => void;
  onStop?: () => void;
  status: ChatStatus;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  selectedReasoning: string;
  onSelectReasoning: (reasoning: string) => void;
  /** Only show quick-prompt chips on empty / new chats. */
  showSuggestions?: boolean;
}

const QUICK_PROMPTS = [
  "Explain quantum computing simply",
  "Write a Python script for data parsing",
  "Summarize the latest AI advancements",
];

export function ChatInput({
  onSend,
  onStop,
  status,
  selectedModel,
  onSelectModel,
  selectedReasoning,
  onSelectReasoning,
  showSuggestions = false,
}: ChatInputProps) {
  const isBusy = status === "submitted" || status === "streaming";
  const canStop = isBusy && Boolean(onStop);

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || isBusy) return;
    onSend(text, selectedModel, selectedReasoning);
  };

  return (
    <div className="shrink-0 border-t border-[rgba(0,0,0,0.06)] bg-background/80 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-4 sm:pt-4 md:p-6 md:pb-6">
      <div className="relative mx-auto w-full max-w-[800px] space-y-2.5 sm:space-y-3">
        {showSuggestions && !isBusy && (
          <Suggestions className="w-full">
            {QUICK_PROMPTS.map((prompt) => (
              <Suggestion
                key={prompt}
                suggestion={prompt}
                onClick={(value) => onSend(value, selectedModel, selectedReasoning)}
                disabled={isBusy}
                className="max-w-[min(100vw-3rem,20rem)] truncate border-[rgba(0,0,0,0.06)] bg-surface-container-low text-gray-medium hover:text-on-surface hover:border-[rgba(0,0,0,0.12)] transition-all duration-200"
              />
            ))}
          </Suggestions>
        )}

        <PromptInput
          onSubmit={handleSubmit}
          className="ambient-shadow w-full border-[rgba(0,0,0,0.06)] bg-white rounded-xl overflow-hidden focus-within:border-[rgba(0,0,0,0.15)] focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] transition-all duration-200"
        >
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Ask Cognito anything..."
              disabled={isBusy}
              className="min-h-[52px] sm:min-h-[64px] max-h-[40vh] font-body-md text-on-surface placeholder:text-gray-medium py-2.5 px-3 sm:py-3 sm:px-4 focus:outline-none"
            />
          </PromptInputBody>
          <PromptInputFooter className="px-2 pb-2 pt-1.5 sm:px-3 sm:pb-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(0,0,0,0.04)] bg-surface-container-lowest">
            <PromptInputTools className="min-w-0 flex-1 overflow-hidden">
              <ModelSelector
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                selectedReasoning={selectedReasoning}
                onSelectReasoning={onSelectReasoning}
              />
            </PromptInputTools>
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <DonutQuotaIndicator />
              <PromptInputSubmit
                status={status}
                onStop={onStop}
                disabled={isBusy && !canStop}
                className="rounded-lg bg-primary hover:bg-[#3d3f42] text-on-primary transition-all duration-200 active:scale-[0.96]"
              />
            </div>
          </PromptInputFooter>
        </PromptInput>

        <p className="text-center font-label-md text-[10px] sm:text-[11px] text-gray-medium px-1">
          Cognito Chat can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  );
}

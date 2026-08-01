"use client";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import type { ChatStatus } from "ai";
import { DictationToolbar } from "./DictationToolbar";

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
    <div className="bg-background/80 shrink-0 border-t border-[rgba(0,0,0,0.06)] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-4 sm:pt-4 md:p-6 md:pb-6">
      <div className="relative mx-auto w-full max-w-[800px] space-y-2.5 sm:space-y-3">
        {showSuggestions && !isBusy && (
          <Suggestions className="w-full">
            {QUICK_PROMPTS.map((prompt) => (
              <Suggestion
                key={prompt}
                suggestion={prompt}
                onClick={(value) =>
                  onSend(value, selectedModel, selectedReasoning)
                }
                disabled={isBusy}
                className="bg-surface-container-low text-gray-medium hover:text-on-surface max-w-[min(100vw-3rem,20rem)] truncate border-[rgba(0,0,0,0.06)] transition-all duration-200 hover:border-[rgba(0,0,0,0.12)]"
              />
            ))}
          </Suggestions>
        )}

        <PromptInputProvider>
          <PromptInput
            onSubmit={handleSubmit}
            className="ambient-shadow w-full overflow-hidden rounded-xl border-[rgba(0,0,0,0.06)] bg-white transition-all duration-200 focus-within:border-[rgba(0,0,0,0.15)] focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          >
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="Ask Cognito anything..."
                disabled={isBusy}
                className="font-body-md text-on-surface placeholder:text-gray-medium max-h-[40vh] min-h-[52px] px-3 py-2.5 focus:outline-none sm:min-h-[64px] sm:px-4 sm:py-3"
              />
            </PromptInputBody>
            <PromptInputFooter className="bg-surface-container-lowest flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(0,0,0,0.04)] px-2 pt-1.5 pb-2 sm:px-3 sm:pb-2.5">
              <DictationToolbar
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                selectedReasoning={selectedReasoning}
                onSelectReasoning={onSelectReasoning}
                status={status}
                onStop={onStop}
                isBusy={isBusy}
                canStop={canStop}
              />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>

        <p className="font-label-md text-gray-medium px-1 text-center text-[10px] sm:text-[11px]">
          Cognito Chat can make mistakes. Consider verifying important
          information.
        </p>
      </div>
    </div>
  );
}

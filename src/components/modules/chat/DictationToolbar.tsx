"use client";

import { Mic, Send, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useSpeechToText } from "@/hooks/stt/useSpeechToText";
import {
  usePromptInputController,
  PromptInputTools,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import type { ChatStatus } from "ai";
import { ModelSelector } from "./ModelSelector";
import { DonutQuotaIndicator } from "./DonutQuotaIndicator";
import { AudioVisualizer } from "./AudioVisualizer";

interface DictationToolbarProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  selectedReasoning: string;
  onSelectReasoning: (reasoning: string) => void;
  status: ChatStatus;
  onStop?: () => void;
  isBusy: boolean;
  canStop: boolean;
  onSubmit: () => void;
}

export function DictationToolbar({
  selectedModel,
  onSelectModel,
  selectedReasoning,
  onSelectReasoning,
  status,
  onStop,
  isBusy,
  canStop,
  onSubmit,
}: DictationToolbarProps) {
  const {
    isListening,
    transcript,
    error,
    mediaStream,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  const controller = usePromptInputController();
  const initialTextRef = useRef("");

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      // Save the text that was already in the input before we start listening
      initialTextRef.current = controller.textInput.value;
      resetTranscript();
      startListening();
    }
  };

  const handleCancel = () => {
    stopListening();
    // Revert to original text before dictation
    controller.textInput.setInput(initialTextRef.current);
    resetTranscript();
  };

  const handleSend = () => {
    stopListening();
    // Ensure the latest transcript is set before submitting
    const spacer = initialTextRef.current && transcript ? " " : "";
    controller.textInput.setInput(initialTextRef.current + spacer + transcript);

    // Slight delay to allow React state to sync into the prompt input before submitting
    setTimeout(() => {
      onSubmit();
    }, 50);
  };

  // Sync the transcript to the prompt input as they speak
  useEffect(() => {
    if (isListening) {
      const spacer = initialTextRef.current && transcript ? " " : "";
      controller.textInput.setInput(
        initialTextRef.current + spacer + transcript,
      );
    }
  }, [transcript, isListening, controller.textInput]);

  if (error && !isListening) {
    console.warn("STT Error:", error);
  }

  if (isListening) {
    return (
      <div className="animate-in fade-in zoom-in-95 flex w-full items-center gap-3 px-1 duration-200">
        <AudioVisualizer mediaStream={mediaStream} className="flex-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="rounded-full border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
        >
          <X className="mr-1.5 h-4 w-4" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          className="bg-primary text-on-primary rounded-full hover:bg-[#3d3f42] active:scale-[0.96]"
        >
          <Send className="mr-1.5 h-4 w-4" />
          Send
        </Button>
      </div>
    );
  }

  return (
    <>
      <PromptInputTools className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        <ModelSelector
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          selectedReasoning={selectedReasoning}
          onSelectReasoning={onSelectReasoning}
        />
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                className="text-gray-medium hover:bg-surface-container-low hover:text-on-surface rounded-full transition-all duration-200"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Dictate Prompt
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </PromptInputTools>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <DonutQuotaIndicator />
        <PromptInputSubmit
          status={status}
          onStop={onStop}
          disabled={isBusy && !canStop}
          className="bg-primary text-on-primary rounded-lg transition-all duration-200 hover:bg-[#3d3f42] active:scale-[0.96]"
        />
      </div>
    </>
  );
}

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
import {
  useSpeechToText,
  isSpeechRecognitionSupported,
} from "@/hooks/stt/useSpeechToText";
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
      initialTextRef.current = controller.textInput.value;
      resetTranscript();
      startListening();
    }
  };

  const handleCancel = () => {
    stopListening();
    controller.textInput.setInput(initialTextRef.current);
    resetTranscript();
  };

  const handleSend = () => {
    stopListening();
    const spacer = initialTextRef.current && transcript ? " " : "";
    controller.textInput.setInput(initialTextRef.current + spacer + transcript);
    setTimeout(() => {
      onSubmit();
    }, 50);
  };

  // Sync live transcript into the prompt input while speaking
  useEffect(() => {
    if (isListening) {
      const spacer = initialTextRef.current && transcript ? " " : "";
      controller.textInput.setInput(
        initialTextRef.current + spacer + transcript,
      );
    }
  }, [transcript, isListening, controller.textInput]);

  // Dictating state — full-width visualizer + icon-only action buttons on mobile
  if (isListening) {
    return (
      <div className="animate-in fade-in zoom-in-95 flex w-full items-center gap-2 px-1 duration-200 sm:gap-3">
        <AudioVisualizer mediaStream={mediaStream} className="flex-1" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCancel}
                className="shrink-0 rounded-full border-red-200 text-red-500 hover:bg-red-50 sm:size-auto sm:px-3 sm:py-1.5 dark:border-red-900/30 dark:hover:bg-red-900/20"
                aria-label="Cancel dictation"
              >
                <X className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden text-sm sm:inline">Cancel</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs sm:hidden">
              Cancel
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                type="button"
                size="icon"
                onClick={handleSend}
                className="bg-primary text-on-primary shrink-0 rounded-full hover:bg-[#3d3f42] active:scale-[0.96] sm:size-auto sm:px-3 sm:py-1.5"
                aria-label="Send dictated prompt"
              >
                <Send className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden text-sm sm:inline">Send</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs sm:hidden">
              Send
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

        {/* Only render mic if SpeechRecognition is supported (hides on Firefox) */}
        {isSpeechRecognitionSupported && (
          <>
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
                    aria-label="Dictate prompt"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Dictate Prompt
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
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

"use client";

import { Check, Loader2, Mic, X } from "lucide-react";
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
  type SttMode,
} from "@/hooks/stt/useSpeechToText";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
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
  /** True while attached files are being uploaded to the backend. */
  isUploading?: boolean;
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
  isUploading = false,
}: DictationToolbarProps) {
  const { data: config } = useGetConfig();

  // AI STT (config toggle) → mic always available, backend transcribes.
  // Browser STT (default) → mic only on browsers with the Web Speech API.
  const aiSttEnabled = config?.enableAiStt ?? false;
  const sttMode: SttMode = aiSttEnabled ? "ai" : "browser";
  const showMic = aiSttEnabled || isSpeechRecognitionSupported;

  const {
    isListening,
    isTranscribing,
    transcript,
    mediaRecorder,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText(sttMode);

  const controller = usePromptInputController();
  const initialTextRef = useRef("");

  const handleToggle = () => {
    if (isListening || isTranscribing) {
      void stopListening(true);
    } else {
      initialTextRef.current = controller.textInput.value;
      resetTranscript();
      void startListening();
    }
  };

  const handleCancel = () => {
    void (async () => {
      await stopListening(true);
      controller.textInput.setInput(initialTextRef.current);
      resetTranscript();
    })();
  };

  const handleDone = () => {
    void (async () => {
      const finalTranscript = await stopListening(false);
      const text = sttMode === "ai" ? (finalTranscript ?? "") : transcript;
      const spacer = initialTextRef.current && text ? " " : "";
      controller.textInput.setInput(initialTextRef.current + spacer + text);
    })();
  };

  // Sync live transcript into the prompt input while speaking
  useEffect(() => {
    if (isListening && sttMode === "browser") {
      const spacer = initialTextRef.current && transcript ? " " : "";
      controller.textInput.setInput(
        initialTextRef.current + spacer + transcript,
      );
    }
  }, [transcript, isListening, sttMode, controller.textInput]);

  // Dictating state — full-width visualizer + icon-only action buttons on mobile
  if (isListening || isTranscribing) {
    return (
      <div className="animate-in fade-in zoom-in-95 flex w-full min-w-0 items-center gap-2 px-1 duration-200 sm:gap-3">
        {isTranscribing ? (
          <div className="text-gray-medium flex h-8 min-w-0 flex-1 items-center gap-2 px-1 text-sm">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span className="truncate">Transcribing…</span>
          </div>
        ) : (
          <AudioVisualizer
            mediaRecorder={mediaRecorder}
            className="min-w-0 flex-1"
          />
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCancel}
                  disabled={isTranscribing}
                  className="shrink-0 rounded-full border-red-200 text-red-500 hover:bg-red-50 sm:size-auto sm:px-3 sm:py-1.5 dark:border-red-900/30 dark:hover:bg-red-900/20"
                  aria-label="Cancel dictation"
                />
              }
            >
              <X className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden text-sm sm:inline">Cancel</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs sm:hidden">
              Cancel
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="icon"
                  onClick={handleDone}
                  disabled={isTranscribing}
                  className="bg-primary text-on-primary shrink-0 rounded-full hover:bg-[#3d3f42] active:scale-[0.96] sm:size-auto sm:px-3 sm:py-1.5"
                  aria-label="Finish dictation and keep transcript"
                />
              }
            >
              <Check className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden text-sm sm:inline">Done</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs sm:hidden">
              Done
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

        {/* AI STT: always show mic. Browser STT: only where SpeechRecognition is supported */}
        {showMic && (
          <>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleToggle}
                      className="text-gray-medium hover:bg-surface-container-low hover:text-on-surface rounded-full transition-all duration-200"
                      aria-label="Dictate prompt"
                    />
                  }
                >
                  <Mic className="h-4 w-4" />
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
          disabled={(isBusy && !canStop) || isUploading}
          className="bg-primary text-on-primary rounded-lg transition-all duration-200 hover:bg-[#3d3f42] active:scale-[0.96]"
        />
      </div>
    </>
  );
}

"use client";

import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import { cn } from "@/lib/utils";
import { BrainCircuit, Check, ChevronDown, ChevronRight, Cpu, Sparkles } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  selectedReasoning: string;
  onSelectReasoning: (reasoning: string) => void;
  className?: string;
}

const MODEL_DESCRIPTIONS: Record<string, string> = {
  "gemini-3.6-flash": "Fast, high-intelligence model for general tasks",
  "gemini-3.5-flash": "Lightweight & responsive low-latency model",
  "gemini-3.5-flash-lite": "Ultra-fast lightweight model for simple queries",
  "gemini-3.1-pro-preview": "Advanced model for deep reasoning & complex code",
  "gemini-3.1-flash-lite": "Low-latency compact model",
  "gemini-3-flash-preview": "Balanced preview model with reasoning options",
};

const DEFAULT_MODEL_REASONING_MAP: Record<string, string[]> = {
  "gemini-3.6-flash": ["none", "minimal", "low", "medium", "high"],
  "gemini-3.5-flash": ["none", "minimal", "low", "medium"],
  "gemini-3.5-flash-lite": ["none"],
  "gemini-3.1-pro-preview": ["none", "minimal", "low", "medium", "high"],
  "gemini-3.1-flash-lite": ["none"],
  "gemini-3-flash-preview": ["none", "minimal", "low", "medium"],
};

export function ModelSelector({
  selectedModel,
  onSelectModel,
  selectedReasoning,
  onSelectReasoning,
  className,
}: ModelSelectorProps) {
  const { data: config } = useGetConfig();

  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const [subReasoningModel, setSubReasoningModel] = useState<string | null>(null);

  const allowedModels = config?.allowedTextModels || [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
  ];

  // Global source of truth for reasoning levels
  const globalAllowedReasoning = (
    config?.allowedReasoningLevels || ["none", "minimal", "low", "medium", "high"]
  ).map((r) => r.toLowerCase());

  const modelReasoningMap = config?.modelReasoningModes || DEFAULT_MODEL_REASONING_MAP;

  // Get allowed reasoning modes for a specific model (filtered against global source of truth)
  const getModesForModel = (modelName: string) => {
    const modes = modelReasoningMap[modelName] || ["none", "minimal", "low", "medium", "high"];
    const filtered = modes
      .map((m) => m.toLowerCase())
      .filter((m) => globalAllowedReasoning.includes(m));
    return filtered.length > 0 ? filtered : ["none"];
  };

  // Currently selected model's allowed reasoning modes
  const currentModelModes = getModesForModel(selectedModel);

  const handleSelectModel = (model: string) => {
    onSelectModel(model);
    const validModes = getModesForModel(model);
    if (!validModes.includes(selectedReasoning.toLowerCase())) {
      onSelectReasoning(validModes[0]);
    }
    setIsModelOpen(false);
    setSubReasoningModel(null);
  };

  const handleSelectModelAndReasoning = (model: string, level: string) => {
    onSelectModel(model);
    onSelectReasoning(level);
    setIsModelOpen(false);
    setSubReasoningModel(null);
  };

  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2", className)}>
      {/* Primary Model Popover (with Nested Reasoning Sub-Popover) */}
      <Popover
        open={isModelOpen}
        onOpenChange={(open) => {
          setIsModelOpen(open);
          if (!open) setSubReasoningModel(null);
        }}
      >
        <PopoverTrigger className="group inline-flex max-w-[min(100%,11rem)] sm:max-w-none items-center gap-1 sm:gap-1.5 rounded-full border border-[rgba(0,0,0,0.06)] bg-white px-2 sm:px-3 py-1.5 text-xs font-semibold text-on-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-[rgba(0,0,0,0.12)] hover:bg-surface-container-low active:scale-[0.98]">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-on-surface/80" />
          <span className="truncate font-headline-md text-label-md tracking-tight-editorial">
            {selectedModel}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-medium transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="top"
          sideOffset={6}
          className="w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-1.5 ambient-shadow"
        >
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-medium">
            <span>Select AI Model</span>
            <span className="text-[10px] text-gray-medium/80">Reasoning Options ➔</span>
          </div>

          <div className="space-y-0.5">
            {allowedModels.map((m) => {
              const isSelected = selectedModel === m;
              const desc = MODEL_DESCRIPTIONS[m] || "Powered by Gemini AI";
              const modes = getModesForModel(m);
              const isSubOpen = subReasoningModel === m;

              return (
                <div key={m} className="relative">
                  <div
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 transition-colors duration-150 group/row",
                      isSelected
                        ? "bg-surface-container-low font-semibold text-on-surface"
                        : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
                    )}
                  >
                    {/* Left main area: Click to select model */}
                    <button
                      type="button"
                      onClick={() => handleSelectModel(m)}
                      className="flex flex-1 items-start gap-2.5 text-left"
                    >
                      <Cpu className="h-4 w-4 shrink-0 text-gray-medium mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-code-sm text-xs font-medium text-on-surface">
                          {m}
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-on-surface" />
                          )}
                        </div>
                        <p className="text-[11px] font-normal text-gray-medium leading-tight">
                          {desc}
                        </p>
                      </div>
                    </button>

                    {/* Right side icon button: Trigger reasoning sub-popover for this model */}
                    <Popover
                      open={isSubOpen}
                      onOpenChange={(open) => setSubReasoningModel(open ? m : null)}
                    >
                      <PopoverTrigger className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[rgba(0,0,0,0.06)] bg-white text-gray-medium transition-colors hover:border-[rgba(0,0,0,0.15)] hover:bg-surface-container-high hover:text-on-surface">
                        <BrainCircuit className="h-3.5 w-3.5" />
                      </PopoverTrigger>

                      <PopoverContent
                        align="start"
                        side="right"
                        sideOffset={8}
                        className="w-48 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-1.5 ambient-shadow"
                      >
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-medium">
                          {m} Reasoning
                        </div>
                        <div className="space-y-0.5">
                          {modes.map((level) => {
                            const isCurrent =
                              isSelected &&
                              selectedReasoning.toLowerCase() === level.toLowerCase();
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => handleSelectModelAndReasoning(m, level)}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs capitalize transition-colors",
                                  isCurrent
                                    ? "bg-surface-container-high font-semibold text-on-surface"
                                    : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
                                )}
                              >
                                <span>{level}</span>
                                {isCurrent && <Check className="h-3.5 w-3.5 text-on-surface" />}
                              </button>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Dedicated Reasoning Pill Popover */}
      <Popover open={isReasoningOpen} onOpenChange={setIsReasoningOpen}>
        <PopoverTrigger className="group inline-flex max-w-[min(100%,9.5rem)] sm:max-w-none items-center gap-1 sm:gap-1.5 rounded-full border border-[rgba(0,0,0,0.06)] bg-white px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-[rgba(0,0,0,0.12)] hover:bg-surface-container-low hover:text-on-surface active:scale-[0.98]">
          <BrainCircuit className="h-3.5 w-3.5 shrink-0 text-gray-medium group-hover:text-on-surface transition-colors" />
          <span className="truncate font-label-md text-label-md capitalize">
            <span className="hidden sm:inline">Reasoning: </span>
            <strong className="font-semibold text-on-surface">{selectedReasoning}</strong>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-medium transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="top"
          sideOffset={6}
          className="w-[min(14rem,calc(100vw-1.5rem))] rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-1.5 ambient-shadow"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-medium">
            Reasoning ({selectedModel})
          </div>
          <div className="space-y-0.5">
            {currentModelModes.map((level) => {
              const isSelected =
                selectedReasoning.toLowerCase() === level.toLowerCase();
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    onSelectReasoning(level);
                    setIsReasoningOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-label-md text-xs capitalize transition-colors duration-150",
                    isSelected
                      ? "bg-surface-container-low font-semibold text-on-surface"
                      : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
                  )}
                >
                  <span>{level}</span>
                  {isSelected && <Check className="h-4 w-4 text-on-surface" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

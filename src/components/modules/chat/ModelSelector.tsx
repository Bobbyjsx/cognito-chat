"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import { cn } from "@/lib/utils";
import { BrainCircuit, Check, ChevronDown, Cpu, Sparkles } from "lucide-react";
import { useState } from "react";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  selectedReasoning: string;
  onSelectReasoning: (reasoning: string) => void;
  className?: string;
}

export interface EffortMode {
  id: "fast" | "balanced" | "extended";
  label: string;
  desc: string;
}

export const EFFORT_MODES: EffortMode[] = [
  {
    id: "fast",
    label: "Fast",
    desc: "Instant responses, minimal/no thinking latency",
  },
  {
    id: "balanced",
    label: "Balanced",
    desc: "Smart reasoning, optimal everyday intelligence",
  },
  {
    id: "extended",
    label: "Extended",
    desc: "Deep multi-step reasoning for complex problems",
  },
];

import { formatModelDisplayName } from "@/lib/models";
export { formatModelDisplayName };

export function ModelSelector({
  selectedModel,
  onSelectModel,
  selectedReasoning,
  onSelectReasoning,
  className,
}: ModelSelectorProps) {
  const { data: config } = useGetConfig();

  const [isModelOpen, setIsModelOpen] = useState(false);
  const [subReasoningModel, setSubReasoningModel] = useState<string | null>(
    null,
  );

  const modelsList = config?.modelsList ?? {};
  const globalAllowedReasoning = (
    config?.allowedReasoningLevels ?? ["fast", "balanced", "extended"]
  ).map((r) => r.toLowerCase());

  // Derive enabled models from modelsList excluding 'auto' to ensure 'auto' is pinned first
  const otherModels = Object.entries(modelsList)
    .filter(([name, cfg]) => cfg.enabled && name.toLowerCase() !== "auto")
    .map(([name]) => name);

  const isAuto = !selectedModel || selectedModel.toLowerCase() === "auto";

  // Intersect a model's own reasoning_modes with the global list
  const getModesForModel = (modelName: string) => {
    if (modelName.toLowerCase() === "auto") {
      return EFFORT_MODES.map((p) => p.id);
    }
    const modelCfg = modelsList[modelName];
    if (!modelCfg) return globalAllowedReasoning;
    return modelCfg.reasoningModes
      .map((m) => m.toLowerCase())
      .filter((m) => globalAllowedReasoning.includes(m));
  };

  const handleSelectModel = (model: string) => {
    onSelectModel(model);
    const validModes = getModesForModel(model);
    if (!validModes.includes(selectedReasoning.toLowerCase())) {
      onSelectReasoning(validModes[0] || "balanced");
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

  const autoDescription =
    modelsList["auto"]?.description ||
    "Automatically selects the optimal model based on prompt complexity and requirements";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      {/* Primary Model Popover (with Nested Reasoning Sub-Popover) */}
      <Popover
        open={isModelOpen}
        onOpenChange={(open) => {
          setIsModelOpen(open);
          if (!open) setSubReasoningModel(null);
        }}
      >
        <PopoverTrigger className="group text-on-surface hover:bg-surface-container-low inline-flex max-w-[min(100%,14rem)] items-center gap-1 rounded-full border border-[rgba(0,0,0,0.06)] bg-white px-2 py-1.5 text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-[rgba(0,0,0,0.12)] active:scale-[0.98] sm:max-w-none sm:gap-1.5 sm:px-3">
          <Sparkles className="text-on-surface/80 h-3.5 w-3.5 shrink-0" />
          <span className="font-headline-md text-label-md tracking-tight-editorial truncate">
            {formatModelDisplayName(selectedModel)}
          </span>
          {selectedReasoning && (
            <span className="text-gray-medium/70 shrink-0 text-[11px] font-normal capitalize">
              · {selectedReasoning}
            </span>
          )}
          <ChevronDown className="text-gray-medium h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="top"
          sideOffset={6}
          className="ambient-shadow w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-1.5"
        >
          <div className="text-gray-medium flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium tracking-wider uppercase">
            <span>Select AI Model</span>
            <span className="text-gray-medium/80 text-[10px]">
              Effort Options ➔
            </span>
          </div>

          <div className="space-y-0.5">
            {/* Auto (Smart Router) Option - Always Pinned First */}
            <div className="relative">
              <div
                className={cn(
                  "group/row flex w-full items-center justify-between rounded-lg px-2.5 py-2 transition-colors duration-150",
                  isAuto
                    ? "bg-surface-container-low text-on-surface font-semibold"
                    : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSelectModel("auto")}
                  className="flex flex-1 items-start gap-2.5 text-left"
                >
                  <Sparkles className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="font-code-sm text-on-surface flex items-center gap-1.5 text-xs font-medium">
                      Auto
                      {isAuto && (
                        <Check className="text-on-surface h-3.5 w-3.5" />
                      )}
                    </div>
                    <p className="text-gray-medium text-[11px] leading-tight font-normal">
                      {autoDescription}
                    </p>
                  </div>
                </button>

                <Popover
                  open={subReasoningModel === "auto"}
                  onOpenChange={(open) =>
                    setSubReasoningModel(open ? "auto" : null)
                  }
                >
                  <PopoverTrigger className="text-gray-medium hover:bg-surface-container-high hover:text-on-surface ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[rgba(0,0,0,0.06)] bg-white transition-colors hover:border-[rgba(0,0,0,0.15)]">
                    <BrainCircuit className="h-3.5 w-3.5" />
                  </PopoverTrigger>

                  <PopoverContent
                    align="start"
                    side="right"
                    sideOffset={8}
                    className="ambient-shadow w-56 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-1.5"
                  >
                    <div className="text-gray-medium px-2 py-1 text-[10px] font-semibold tracking-wider uppercase">
                      Effort & Routing Policy
                    </div>
                    <div className="space-y-0.5">
                      {EFFORT_MODES.map((effort) => {
                        const isCurrent =
                          isAuto &&
                          (selectedReasoning.toLowerCase() === effort.id ||
                            (!selectedReasoning && effort.id === "balanced"));
                        return (
                          <button
                            key={effort.id}
                            type="button"
                            onClick={() =>
                              handleSelectModelAndReasoning("auto", effort.id)
                            }
                            className={cn(
                              "flex w-full flex-col items-start rounded-md px-2.5 py-1.5 text-xs transition-colors",
                              isCurrent
                                ? "bg-surface-container-high text-on-surface font-semibold"
                                : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
                            )}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="capitalize">{effort.label}</span>
                              {isCurrent && (
                                <Check className="text-on-surface h-3.5 w-3.5" />
                              )}
                            </div>
                            <span className="text-gray-medium/80 text-[10px] leading-tight font-normal">
                              {effort.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Specific Models */}
            {otherModels.map((m) => {
              const isSelected = !isAuto && selectedModel === m;
              const desc = modelsList[m]?.description ?? "Powered by Gemini AI";
              const modes = getModesForModel(m);
              const isSubOpen = subReasoningModel === m;

              return (
                <div key={m} className="relative">
                  <div
                    className={cn(
                      "group/row flex w-full items-center justify-between rounded-lg px-2.5 py-2 transition-colors duration-150",
                      isSelected
                        ? "bg-surface-container-low text-on-surface font-semibold"
                        : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
                    )}
                  >
                    {/* Left main area: Click to select model */}
                    <button
                      type="button"
                      onClick={() => handleSelectModel(m)}
                      className="flex flex-1 items-start gap-2.5 text-left"
                    >
                      <Cpu className="text-gray-medium mt-0.5 h-4 w-4 shrink-0" />
                      <div className="space-y-0.5">
                        <div className="font-code-sm text-on-surface flex items-center gap-1.5 text-xs font-medium">
                          {formatModelDisplayName(m)}
                          {isSelected && (
                            <Check className="text-on-surface h-3.5 w-3.5" />
                          )}
                        </div>
                        <p className="text-gray-medium text-[11px] leading-tight font-normal">
                          {desc}
                        </p>
                      </div>
                    </button>

                    {/* Right side icon button: Trigger reasoning sub-popover for this model */}
                    <Popover
                      open={isSubOpen}
                      onOpenChange={(open) =>
                        setSubReasoningModel(open ? m : null)
                      }
                    >
                      <PopoverTrigger className="text-gray-medium hover:bg-surface-container-high hover:text-on-surface ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[rgba(0,0,0,0.06)] bg-white transition-colors hover:border-[rgba(0,0,0,0.15)]">
                        <BrainCircuit className="h-3.5 w-3.5" />
                      </PopoverTrigger>

                      <PopoverContent
                        align="start"
                        side="right"
                        sideOffset={8}
                        className="ambient-shadow w-56 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-1.5"
                      >
                        <div className="text-gray-medium px-2 py-1 text-[10px] font-semibold tracking-wider uppercase">
                          Thinking Effort
                        </div>
                        <div className="space-y-0.5">
                          {EFFORT_MODES.filter((eff) =>
                            modes.includes(eff.id),
                          ).map((eff) => {
                            const isCurrent =
                              isSelected &&
                              selectedReasoning.toLowerCase() === eff.id;
                            return (
                              <button
                                key={eff.id}
                                type="button"
                                onClick={() =>
                                  handleSelectModelAndReasoning(m, eff.id)
                                }
                                className={cn(
                                  "flex w-full flex-col items-start rounded-md px-2.5 py-1.5 text-xs transition-colors",
                                  isCurrent
                                    ? "bg-surface-container-high text-on-surface font-semibold"
                                    : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
                                )}
                              >
                                <div className="flex w-full items-center justify-between">
                                  <span className="capitalize">
                                    {eff.label}
                                  </span>
                                  {isCurrent && (
                                    <Check className="text-on-surface h-3.5 w-3.5" />
                                  )}
                                </div>
                                <span className="text-gray-medium/80 text-[10px] leading-tight font-normal">
                                  {eff.desc}
                                </span>
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
    </div>
  );
}

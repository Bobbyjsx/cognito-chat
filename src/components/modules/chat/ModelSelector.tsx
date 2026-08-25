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

const ROUTING_POLICIES = [
  {
    id: "balanced",
    label: "Balanced",
    desc: "Best balance of speed and intelligence",
  },
  {
    id: "speed",
    label: "Speed",
    desc: "Instant response with minimal latency",
  },
  {
    id: "quality",
    label: "Quality",
    desc: "Deep reasoning and high intelligence",
  },
  { id: "cost", label: "Cost", desc: "Quota-friendly & token efficient" },
];

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
  const globalAllowedReasoning = (config?.allowedReasoningLevels ?? []).map(
    (r) => r.toLowerCase(),
  );

  // Derive enabled models from modelsList
  const allowedModels = Object.entries(modelsList)
    .filter(([, cfg]) => cfg.enabled)
    .map(([name]) => name);

  const isAuto = !selectedModel || selectedModel.toLowerCase() === "auto";

  // Intersect a model's own reasoning_modes with the global list
  const getModesForModel = (modelName: string) => {
    if (modelName.toLowerCase() === "auto") {
      return ROUTING_POLICIES.map((p) => p.id);
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
            {isAuto ? "Auto (Smart Router)" : selectedModel}
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
              {isAuto ? "Policy Options ➔" : "Reasoning Options ➔"}
            </span>
          </div>

          <div className="space-y-0.5">
            {/* Auto (Smart Router) Option */}
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
                  onClick={() => handleSelectModel("Auto")}
                  className="flex flex-1 items-start gap-2.5 text-left"
                >
                  <Sparkles className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="font-code-sm text-on-surface flex items-center gap-1.5 text-xs font-medium">
                      Auto (Smart Router)
                      {isAuto && (
                        <Check className="text-on-surface h-3.5 w-3.5" />
                      )}
                    </div>
                    <p className="text-gray-medium text-[11px] leading-tight font-normal">
                      Dynamically chooses the best model & reasoning for each
                      prompt
                    </p>
                  </div>
                </button>

                <Popover
                  open={subReasoningModel === "Auto"}
                  onOpenChange={(open) =>
                    setSubReasoningModel(open ? "Auto" : null)
                  }
                >
                  <PopoverTrigger className="text-gray-medium hover:bg-surface-container-high hover:text-on-surface ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[rgba(0,0,0,0.06)] bg-white transition-colors hover:border-[rgba(0,0,0,0.15)]">
                    <BrainCircuit className="h-3.5 w-3.5" />
                  </PopoverTrigger>

                  <PopoverContent
                    align="start"
                    side="right"
                    sideOffset={8}
                    className="ambient-shadow w-52 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-1.5"
                  >
                    <div className="text-gray-medium px-2 py-1 text-[10px] font-semibold tracking-wider uppercase">
                      Routing Policy
                    </div>
                    <div className="space-y-0.5">
                      {ROUTING_POLICIES.map((policy) => {
                        const isCurrent =
                          isAuto &&
                          (selectedReasoning.toLowerCase() === policy.id ||
                            (!selectedReasoning && policy.id === "balanced"));
                        return (
                          <button
                            key={policy.id}
                            type="button"
                            onClick={() =>
                              handleSelectModelAndReasoning("Auto", policy.id)
                            }
                            className={cn(
                              "flex w-full flex-col items-start rounded-md px-2.5 py-1.5 text-xs transition-colors",
                              isCurrent
                                ? "bg-surface-container-high text-on-surface font-semibold"
                                : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
                            )}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="capitalize">{policy.label}</span>
                              {isCurrent && (
                                <Check className="text-on-surface h-3.5 w-3.5" />
                              )}
                            </div>
                            <span className="text-gray-medium/80 text-[10px] leading-tight font-normal">
                              {policy.desc}
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
            {allowedModels.map((m) => {
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
                          {m}
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
                        className="ambient-shadow w-48 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-1.5"
                      >
                        <div className="text-gray-medium px-2 py-1 text-[10px] font-semibold tracking-wider uppercase">
                          {m} Reasoning
                        </div>
                        <div className="space-y-0.5">
                          {modes.map((level) => {
                            const isCurrent =
                              isSelected &&
                              selectedReasoning.toLowerCase() ===
                                level.toLowerCase();
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() =>
                                  handleSelectModelAndReasoning(m, level)
                                }
                                className={cn(
                                  "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs capitalize transition-colors",
                                  isCurrent
                                    ? "bg-surface-container-high text-on-surface font-semibold"
                                    : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
                                )}
                              >
                                <span>{level}</span>
                                {isCurrent && (
                                  <Check className="text-on-surface h-3.5 w-3.5" />
                                )}
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

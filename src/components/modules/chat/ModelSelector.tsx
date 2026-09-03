"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import { formatModelDisplayName } from "@/lib/models";
import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { useState } from "react";

export { formatModelDisplayName };

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  selectedReasoning: string;
  onSelectReasoning: (reasoning: string) => void;
  className?: string;
}

export interface EffortMode {
  id: "fast" | "balanced" | "extended" | string;
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

export function ModelSelector({
  selectedModel,
  onSelectModel,
  selectedReasoning,
  onSelectReasoning,
  className,
}: ModelSelectorProps) {
  const { data: config } = useGetConfig();

  const [isOpen, setIsOpen] = useState(false);
  const [isEffortSubOpen, setIsEffortSubOpen] = useState(false);

  const modelsList = config?.modelsList ?? {};
  const globalAllowedReasoning = (
    config?.allowedReasoningLevels ?? ["fast", "balanced", "extended"]
  ).map((r) => r.toLowerCase());

  // Derive enabled models from modelsList excluding 'auto' to ensure 'auto' is pinned first
  const otherModels = Object.entries(modelsList)
    .filter(([name, cfg]) => cfg.enabled && name.toLowerCase() !== "auto")
    .map(([name]) => name);

  const isAuto = !selectedModel || selectedModel.toLowerCase() === "auto";

  // Intersect a model's own reasoning_modes with the global allowed list
  const getModesForModel = (modelName: string) => {
    if (!modelName || modelName.toLowerCase() === "auto") {
      return globalAllowedReasoning.length > 0
        ? globalAllowedReasoning
        : EFFORT_MODES.map((p) => p.id);
    }
    const modelCfg = modelsList[modelName];
    if (
      !modelCfg ||
      !modelCfg.reasoningModes ||
      modelCfg.reasoningModes.length === 0
    ) {
      return globalAllowedReasoning;
    }
    const filtered = modelCfg.reasoningModes
      .map((m) => m.toLowerCase())
      .filter((m) => globalAllowedReasoning.includes(m));
    return filtered.length > 0 ? filtered : globalAllowedReasoning;
  };

  const handleSelectModel = (model: string) => {
    onSelectModel(model);
    const validModes = getModesForModel(model);
    if (!validModes.includes((selectedReasoning || "").toLowerCase())) {
      onSelectReasoning(validModes[0] || "balanced");
    }
  };

  const handleSelectReasoning = (effortId: string) => {
    onSelectReasoning(effortId);
    setIsEffortSubOpen(false);
  };

  const currentModes = getModesForModel(selectedModel);
  const availableEfforts = EFFORT_MODES.filter((eff) =>
    currentModes.includes(eff.id.toLowerCase()),
  );
  const extraEfforts = currentModes
    .filter(
      (mode) => !EFFORT_MODES.some((eff) => eff.id.toLowerCase() === mode),
    )
    .map((mode) => ({
      id: mode,
      label: mode.charAt(0).toUpperCase() + mode.slice(1),
      desc: "Reasoning effort level",
    }));
  const dynamicEfforts = [...availableEfforts, ...extraEfforts];

  const getEffortLabel = (effortId: string) => {
    const mode = dynamicEfforts.find(
      (m) => m.id.toLowerCase() === effortId.toLowerCase(),
    );
    if (mode) return mode.label;
    return effortId.charAt(0).toUpperCase() + effortId.slice(1);
  };

  const activeEffortId = (
    selectedReasoning ||
    dynamicEfforts[0]?.id ||
    "balanced"
  ).toLowerCase();
  const currentEffortLabel = getEffortLabel(activeEffortId);

  const autoDescription =
    modelsList["auto"]?.description ||
    "Automatically selects the optimal model based on prompt complexity";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setIsEffortSubOpen(false);
        }}
      >
        <PopoverTrigger className="group text-on-surface hover:bg-surface-container-low inline-flex max-w-[min(100%,16rem)] cursor-pointer items-center gap-1 rounded-full border border-[rgba(0,0,0,0.06)] bg-white px-2 py-1.5 text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-[rgba(0,0,0,0.12)] active:scale-[0.98] sm:max-w-none sm:gap-1.5 sm:px-3">
          <Cpu className="text-on-surface/80 h-3.5 w-3.5 shrink-0" />
          <span className="font-headline-md text-label-md tracking-tight-editorial truncate">
            {formatModelDisplayName(selectedModel)}
          </span>
          {currentEffortLabel && (
            <span className="text-gray-medium/80 shrink-0 text-[11px] font-normal capitalize">
              · {currentEffortLabel}
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
          {/* Header */}
          <div className="text-gray-medium px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-wider uppercase">
            Select AI Model
          </div>

          {/* Model List */}
          <div className="max-h-64 space-y-0.5 overflow-y-auto pr-0.5">
            {/* Auto (Smart Router) Option - Always Pinned First */}
            <button
              type="button"
              onClick={() => handleSelectModel("auto")}
              className={cn(
                "group flex w-full cursor-pointer items-start justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors duration-150",
                isAuto
                  ? "bg-surface-container-low text-on-surface font-semibold"
                  : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
              )}
            >
              <div className="flex items-start gap-2.5">
                <Cpu className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-code-sm text-on-surface flex items-center gap-1.5 text-xs font-medium">
                    Auto
                  </div>
                  <p className="text-gray-medium text-[11px] leading-tight font-normal">
                    {autoDescription}
                  </p>
                </div>
              </div>
              {isAuto && (
                <Check className="text-on-surface mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
            </button>

            {/* Specific Models */}
            {otherModels.map((m) => {
              const isSelected = !isAuto && selectedModel === m;
              const desc = modelsList[m]?.description ?? "Powered by Gemini AI";

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectModel(m)}
                  className={cn(
                    "group flex w-full cursor-pointer items-start justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors duration-150",
                    isSelected
                      ? "bg-surface-container-low text-on-surface font-semibold"
                      : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Cpu className="text-gray-medium mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div className="space-y-0.5">
                      <div className="font-code-sm text-on-surface flex items-center gap-1.5 text-xs font-medium">
                        {formatModelDisplayName(m)}
                      </div>
                      <p className="text-gray-medium text-[11px] leading-tight font-normal">
                        {desc}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="text-on-surface mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sticky Bottom Reasoning Effort Option with Sub-Popover */}
          {dynamicEfforts.length > 0 && (
            <>
              <Separator className="my-1.5 bg-[rgba(0,0,0,0.06)]" />

              <Popover open={isEffortSubOpen} onOpenChange={setIsEffortSubOpen}>
                <PopoverTrigger className="group/effort hover:bg-surface-container-low flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors duration-150">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="text-primary h-3.5 w-3.5 shrink-0" />
                    <span className="text-on-surface text-xs font-medium">
                      Reasoning Effort
                    </span>
                  </div>
                  <div className="text-gray-medium flex items-center gap-1">
                    <span className="text-xs font-normal capitalize">
                      {currentEffortLabel}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover/effort:translate-x-0.5" />
                  </div>
                </PopoverTrigger>

                <PopoverContent
                  side="right"
                  align="end"
                  sideOffset={8}
                  className="ambient-shadow w-56 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-1.5"
                >
                  <div className="text-gray-medium px-2 py-1 text-[10px] font-semibold tracking-wider uppercase">
                    Thinking Effort
                  </div>
                  <div className="space-y-0.5">
                    {dynamicEfforts.map((effort) => {
                      const isCurrent =
                        activeEffortId === effort.id.toLowerCase();
                      return (
                        <button
                          key={effort.id}
                          type="button"
                          onClick={() => handleSelectReasoning(effort.id)}
                          className={cn(
                            "flex w-full cursor-pointer flex-col items-start rounded-md px-2.5 py-1.5 text-xs transition-colors",
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
                          <span className="text-gray-medium/80 text-left text-[10px] leading-tight font-normal">
                            {effort.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

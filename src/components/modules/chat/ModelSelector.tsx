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
import { useMemo, useState } from "react";

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

interface ProviderMeta {
  id: string;
  name: string;
  description: string;
  models: string[];
  order: number;
}

const PROVIDER_METADATA: Record<
  string,
  { name: string; description: string; order: number }
> = {
  google: {
    name: "Google",
    description:
      "Multimodal reasoning, fast Flash models & deep Pro intelligence",
    order: 1,
  },
  anthropic: {
    name: "Anthropic",
    description: "Industry-leading coding, analysis, and extended thinking",
    order: 2,
  },
  openai: {
    name: "OpenAI",
    description: "Advanced reasoning and versatile flagship language models",
    order: 3,
  },
};

function resolveModelProvider(
  modelName: string,
  declaredProvider?: string,
): string {
  if (declaredProvider && declaredProvider.trim()) {
    return declaredProvider.trim().toLowerCase();
  }
  const lower = modelName.toLowerCase();
  if (lower.startsWith("claude")) return "anthropic";
  if (lower.startsWith("gemini")) return "google";
  if (
    lower.startsWith("gpt") ||
    lower.startsWith("o1") ||
    lower.startsWith("o3") ||
    lower.startsWith("o4")
  ) {
    return "openai";
  }
  if (lower.startsWith("deepseek")) return "deepseek";
  return "other";
}

function getProviderMeta(providerId: string): {
  name: string;
  description: string;
  order: number;
} {
  const normalized = providerId.toLowerCase();
  if (PROVIDER_METADATA[normalized]) {
    return PROVIDER_METADATA[normalized];
  }
  const name = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return {
    name,
    description: `AI models powered by ${name}`,
    order: 99,
  };
}

export function ModelSelector({
  selectedModel,
  onSelectModel,
  selectedReasoning,
  onSelectReasoning,
  className,
}: ModelSelectorProps) {
  const { data: config } = useGetConfig();

  const [isOpen, setIsOpen] = useState(false);
  const [openSubPopover, setOpenSubPopover] = useState<string | null>(null);

  const modelsList = config?.modelsList ?? {};
  const globalAllowedReasoning = (
    config?.allowedReasoningLevels ?? ["fast", "balanced", "extended"]
  ).map((r) => r.toLowerCase());

  const isAuto = !selectedModel || selectedModel.toLowerCase() === "auto";

  // Group enabled models by provider (excluding 'auto')
  const providerGroups = useMemo<ProviderMeta[]>(() => {
    const groups: Record<string, string[]> = {};

    Object.entries(modelsList).forEach(([name, cfg]) => {
      if (!cfg.enabled || name.toLowerCase() === "auto") return;
      const provId = resolveModelProvider(name, cfg.provider);
      if (!groups[provId]) {
        groups[provId] = [];
      }
      groups[provId].push(name);
    });

    return Object.entries(groups)
      .map(([provId, models]) => {
        const meta = getProviderMeta(provId);
        return {
          id: provId,
          name: meta.name,
          description: meta.description,
          models,
          order: meta.order,
        };
      })
      .sort((a, b) => a.order - b.order);
  }, [modelsList]);

  // Identify which provider the currently active model belongs to
  const activeProviderId = useMemo(() => {
    if (isAuto) return null;
    const cfg = modelsList[selectedModel];
    return resolveModelProvider(selectedModel, cfg?.provider);
  }, [isAuto, selectedModel, modelsList]);

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
    setOpenSubPopover(null);
    setIsOpen(false);
  };

  const handleSelectReasoning = (effortId: string) => {
    onSelectReasoning(effortId);
    setOpenSubPopover(null);
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
          if (!open) setOpenSubPopover(null);
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
          <div className="max-h-72 space-y-0.5 overflow-y-auto pr-0.5">
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

            {/* Providers with Sub-Popovers */}
            {providerGroups.map((provider) => {
              const isSelectedProvider = activeProviderId === provider.id;
              const activeModelInProvider = isSelectedProvider
                ? selectedModel
                : undefined;

              return (
                <Popover
                  key={provider.id}
                  open={openSubPopover === provider.id}
                  onOpenChange={(open) => {
                    setOpenSubPopover(open ? provider.id : null);
                  }}
                >
                  <PopoverTrigger
                    className={cn(
                      "group/prov hover:bg-surface-container-low flex w-full cursor-pointer items-start justify-between rounded-lg px-2.5 py-2 text-left transition-colors duration-150",
                      isSelectedProvider
                        ? "bg-surface-container-low/60 text-on-surface"
                        : "text-gray-medium hover:text-on-surface",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Cpu
                        className={cn(
                          "mt-0.5 h-3.5 w-3.5 shrink-0",
                          isSelectedProvider
                            ? "text-primary"
                            : "text-gray-medium",
                        )}
                      />
                      <div className="space-y-0.5">
                        <div className="font-code-sm text-on-surface flex items-center gap-1.5 text-xs font-medium">
                          {provider.name}
                        </div>
                        <p className="text-gray-medium text-[11px] leading-tight font-normal">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-gray-medium flex shrink-0 items-center gap-1 pt-0.5">
                      {activeModelInProvider && (
                        <span className="text-primary max-w-[100px] truncate text-[11px] font-medium">
                          {formatModelDisplayName(activeModelInProvider)}
                        </span>
                      )}
                      <ChevronRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover/prov:translate-x-0.5" />
                    </div>
                  </PopoverTrigger>

                  <PopoverContent
                    side="right"
                    align="start"
                    sideOffset={8}
                    className="ambient-shadow w-72 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-1.5"
                  >
                    <div className="text-gray-medium px-2 py-1 text-[10px] font-semibold tracking-wider uppercase">
                      {provider.name} Models
                    </div>
                    <div className="max-h-64 space-y-0.5 overflow-y-auto pr-0.5">
                      {provider.models.map((m) => {
                        const isSelected = !isAuto && selectedModel === m;
                        const desc = modelsList[m]?.description ?? "";

                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSelectModel(m)}
                            className={cn(
                              "group flex w-full cursor-pointer items-start justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors duration-150",
                              isSelected
                                ? "bg-surface-container-high text-on-surface font-semibold"
                                : "text-gray-medium hover:bg-surface-container-low hover:text-on-surface",
                            )}
                          >
                            <div className="flex items-start gap-2.5">
                              <Cpu
                                className={cn(
                                  "mt-0.5 h-3.5 w-3.5 shrink-0",
                                  isSelected
                                    ? "text-primary"
                                    : "text-gray-medium",
                                )}
                              />
                              <div className="space-y-0.5">
                                <div className="font-code-sm text-on-surface flex items-center gap-1.5 text-xs font-medium">
                                  {formatModelDisplayName(m)}
                                </div>
                                {desc && (
                                  <p className="text-gray-medium text-[11px] leading-tight font-normal">
                                    {desc}
                                  </p>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="text-on-surface mt-0.5 h-3.5 w-3.5 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>

          {/* Sticky Bottom Reasoning Effort Option with Sub-Popover */}
          {dynamicEfforts.length > 0 && (
            <>
              <Separator className="my-1.5 bg-[rgba(0,0,0,0.06)]" />

              <Popover
                open={openSubPopover === "effort"}
                onOpenChange={(open) => {
                  setOpenSubPopover(open ? "effort" : null);
                }}
              >
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

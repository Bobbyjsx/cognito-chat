"use client";

import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import { Badge } from "@/components/ui/badge";
import { Cpu, BrainCircuit } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  selectedReasoning: string;
  onSelectReasoning: (reasoning: string) => void;
}

export function ModelSelector({
  selectedModel,
  onSelectModel,
  selectedReasoning,
  onSelectReasoning,
}: ModelSelectorProps) {
  const { data: config } = useGetConfig();

  const allowedModels = config?.allowedTextModels || [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-pro-preview",
  ];

  const allowedReasoning = config?.allowedReasoningLevels || [
    "none",
    "minimal",
    "low",
    "medium",
    "high",
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5 backdrop-blur-md">
      {/* Model Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Cpu className="h-3.5 w-3.5 text-indigo-400" />
          <span>Model:</span>
        </div>

        <select
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          {allowedModels.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <Badge variant="outline" className="hidden sm:inline-flex border-indigo-500/30 text-[10px] text-indigo-300">
          Active
        </Badge>
      </div>

      {/* Reasoning Effort Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <BrainCircuit className="h-3.5 w-3.5 text-purple-400" />
          <span>Reasoning Effort:</span>
        </div>

        <div className="flex items-center gap-1">
          {allowedReasoning.map((level) => {
            const isSelected = selectedReasoning.toLowerCase() === level.toLowerCase();
            return (
              <button
                key={level}
                type="button"
                onClick={() => onSelectReasoning(level)}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium capitalize transition-all ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
                    : "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

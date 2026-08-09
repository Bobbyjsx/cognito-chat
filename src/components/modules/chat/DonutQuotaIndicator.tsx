"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import {
  Context,
  ContextContent,
  ContextContentBody,
  ContextContentHeader,
  ContextTrigger,
} from "@/components/ai-elements/context";
import { getQuotaSnapshot } from "@/lib/quota";
import { Zap, Calendar, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function DonutQuotaIndicator() {
  const { data: profile, refetch, isRefetching } = useProfile();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const q = getQuotaSnapshot(profile, nowMs, "short");

  return (
    <Context usedTokens={q.used6h} maxTokens={q.limit6h}>
      <ContextTrigger className="font-label-md hover:bg-surface-container-low h-8 rounded-full border border-[rgba(0,0,0,0.06)] bg-white px-2.5 py-1 text-xs transition-all duration-200 hover:border-[rgba(0,0,0,0.12)]" />

      <ContextContent
        align="end"
        side="top"
        sideOffset={8}
        className="ambient-shadow w-72 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
      >
        <ContextContentHeader className="border-b border-[rgba(0,0,0,0.06)]" />

        <ContextContentBody className="space-y-3 p-3 text-xs">
          <div className="text-on-surface flex items-center justify-between font-semibold">
            <div className="flex items-center gap-1.5">
              <span>Quota Windows</span>
              <Clock className="text-gray-medium h-3.5 w-3.5" />
            </div>
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="text-gray-medium hover:text-on-surface hover:bg-surface-container-low rounded-md p-1 transition-all"
              title="Refresh Quota"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")}
              />
            </button>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-on-surface flex items-center gap-1.5 font-medium">
                <Zap className="text-on-surface/70 h-3.5 w-3.5" /> 6-Hour Limit
              </span>
              <span className="text-on-surface font-semibold">{q.pct6h}%</span>
            </div>
            <div className="text-gray-medium text-[11px]">
              {q.used6h.toLocaleString()} / {q.limit6h.toLocaleString()} tokens
            </div>
            <div className="text-gray-medium text-[11px] font-medium italic">
              ⏱ 6-Hour {q.reset6hText}
            </div>
          </div>

          <div className="border-t border-[rgba(0,0,0,0.04)]" />

          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-on-surface flex items-center gap-1.5 font-medium">
                <Calendar className="text-on-surface/70 h-3.5 w-3.5" /> Weekly
                Quota
              </span>
              <span className="text-on-surface font-semibold">
                {q.pctWeekly}%
              </span>
            </div>
            <div className="text-gray-medium text-[11px]">
              {q.usedWeekly.toLocaleString()} / {q.limitWeekly.toLocaleString()}{" "}
              tokens
            </div>
            <div className="text-gray-medium text-[11px] font-medium italic">
              ⏱ Weekly {q.resetWeeklyText}
            </div>
          </div>
        </ContextContentBody>
      </ContextContent>
    </Context>
  );
}

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
import { Zap, Calendar, Clock } from "lucide-react";

export function DonutQuotaIndicator() {
  const { data: profile } = useProfile();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const q = getQuotaSnapshot(profile, nowMs, "short");

  return (
    <Context usedTokens={q.used6h} maxTokens={q.limit6h}>
      <ContextTrigger className="h-8 rounded-full border border-[rgba(0,0,0,0.06)] bg-white px-2.5 py-1 font-label-md text-xs hover:border-[rgba(0,0,0,0.12)] hover:bg-surface-container-low transition-all duration-200" />

      <ContextContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-72 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white ambient-shadow"
      >
        <ContextContentHeader className="border-b border-[rgba(0,0,0,0.06)]" />

        <ContextContentBody className="space-y-3 p-3 text-xs">
          <div className="flex items-center justify-between font-semibold text-on-surface">
            <span>Quota Windows</span>
            <Clock className="h-3.5 w-3.5 text-gray-medium" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-on-surface">
                <Zap className="h-3.5 w-3.5 text-on-surface/70" /> 6-Hour Limit
              </span>
              <span className="font-semibold text-on-surface">{q.pct6h}%</span>
            </div>
            <div className="text-[11px] text-gray-medium">
              {q.used6h.toLocaleString()} / {q.limit6h.toLocaleString()} tokens
            </div>
            <div className="text-[11px] font-medium text-gray-medium italic">
              ⏱ 6-Hour {q.reset6hText}
            </div>
          </div>

          <div className="border-t border-[rgba(0,0,0,0.04)]" />

          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-on-surface">
                <Calendar className="h-3.5 w-3.5 text-on-surface/70" /> Weekly Quota
              </span>
              <span className="font-semibold text-on-surface">{q.pctWeekly}%</span>
            </div>
            <div className="text-[11px] text-gray-medium">
              {q.usedWeekly.toLocaleString()} / {q.limitWeekly.toLocaleString()} tokens
            </div>
            <div className="text-[11px] font-medium text-gray-medium italic">
              ⏱ Weekly {q.resetWeeklyText}
            </div>
          </div>
        </ContextContentBody>
      </ContextContent>
    </Context>
  );
}

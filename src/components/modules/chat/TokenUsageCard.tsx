"use client";

import { useProfile } from "@/hooks/data/useAuth/useAuth";
import { Card } from "@/components/ui/card";
import { Zap, Calendar } from "lucide-react";

export function TokenUsageCard() {
  const { data: profile } = useProfile();

  const tokensUsed6h = profile?.tokensUsed6h ?? profile?.tokensUsed ?? 0;
  const tokenLimit6h = profile?.tokenLimit6h ?? profile?.tokenLimit ?? 60000;
  const pct6h = Math.min(Math.round((tokensUsed6h / tokenLimit6h) * 100), 100);

  const tokensUsedWeekly = profile?.tokensUsedWeekly ?? 0;
  const tokenLimitWeekly = profile?.tokenLimitWeekly ?? 300000;
  const pctWeekly = Math.min(Math.round((tokensUsedWeekly / tokenLimitWeekly) * 100), 100);

  return (
    <Card className="p-3.5 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-slate-800 shadow-lg space-y-3">
      {/* 6-Hour Quota Window */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <Zap className="h-3.5 w-3.5 text-amber-400" /> 6-Hour Window
          </span>
          <span className="font-semibold text-amber-400">{pct6h}%</span>
        </div>

        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-500 rounded-full"
            style={{ width: `${pct6h}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{tokensUsed6h.toLocaleString()} used</span>
          <span>{tokenLimit6h.toLocaleString()} cap</span>
        </div>
      </div>

      {/* Weekly Quota Window */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-purple-400" /> Weekly Quota
          </span>
          <span className="font-semibold text-purple-400">{pctWeekly}%</span>
        </div>

        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 rounded-full"
            style={{ width: `${pctWeekly}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{tokensUsedWeekly.toLocaleString()} used</span>
          <span>{tokenLimitWeekly.toLocaleString()} cap</span>
        </div>
      </div>
    </Card>
  );
}

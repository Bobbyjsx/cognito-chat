import type { UserProfile } from "@/types";

export type CountdownStyle = "short" | "long";

export type QuotaSnapshot = {
  used6h: number;
  limit6h: number;
  pct6h: number;
  reset6hText: string;
  usedWeekly: number;
  limitWeekly: number;
  pctWeekly: number;
  resetWeeklyText: string;
};

/** Relative reset countdown from an ISO timestamp. */
export function formatCountdown(
  isoString: string | null | undefined,
  nowMs: number,
  style: CountdownStyle = "long",
): string {
  if (!isoString) return "Resets soon";
  const target = new Date(isoString).getTime();
  const diff = target - nowMs;
  if (diff <= 0) return "Resets soon";

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (style === "short") {
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return `resets in ${parts.join(" ")}`;
  }

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} ${minutes === 1 ? "min" : "mins"}`);
  }
  return `resets in ${parts.join(", ")}`;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Normalize profile quota fields for UI (camelCase preferred; legacy keys tolerated).
 */
export function getQuotaSnapshot(
  profile: UserProfile | undefined,
  nowMs: number,
  countdownStyle: CountdownStyle = "long",
): QuotaSnapshot {
  const raw = profile as unknown as Record<string, unknown> | undefined;

  const used6h = num(
    profile?.tokensUsed6h ?? raw?.tokensUsed_6h ?? profile?.tokensUsed,
  );
  const limit6h = num(
    profile?.tokenLimit6h ?? raw?.tokenLimit_6h ?? profile?.tokenLimit,
    60_000,
  );
  const pct6h = num(
    profile?.pct6h ?? raw?.pct_6h,
    Math.min(Math.round((used6h / Math.max(limit6h, 1)) * 100), 100),
  );

  const usedWeekly = num(
    profile?.tokensUsedWeekly ?? raw?.tokensUsed_weekly,
  );
  const limitWeekly = num(
    profile?.tokenLimitWeekly ?? raw?.tokenLimit_weekly,
    300_000,
  );
  const pctWeekly = num(
    profile?.pctWeekly ?? raw?.pct_weekly,
    Math.min(Math.round((usedWeekly / Math.max(limitWeekly, 1)) * 100), 100),
  );

  const reset6hText =
    str(profile?.resetCountdown6h) ||
    str(raw?.reset_countdown_6h) ||
    formatCountdown(
      str(profile?.resetAt) || str(raw?.reset_at),
      nowMs,
      countdownStyle,
    );

  const resetWeeklyText =
    str(profile?.resetCountdownWeekly) ||
    str(raw?.reset_countdown_weekly) ||
    formatCountdown(
      str(profile?.weeklyResetAt) || str(raw?.weekly_reset_at),
      nowMs,
      countdownStyle,
    );

  return {
    used6h,
    limit6h,
    pct6h,
    reset6hText,
    usedWeekly,
    limitWeekly,
    pctWeekly,
    resetWeeklyText,
  };
}

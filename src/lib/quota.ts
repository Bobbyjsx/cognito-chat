import type { UserProfile } from "@/types";

export type CountdownStyle = "short" | "long";

export type QuotaSnapshot = {
  pct6h: number;
  reset6hText: string;
  pctWeekly: number;
  resetWeeklyText: string;
};

/** Parse an ISO string safely as UTC epoch milliseconds even if timezone designator is omitted. */
export function parseUtcMs(isoString: string | null | undefined): number {
  if (!isoString) return NaN;
  const trimmed = isoString.trim();
  const hasTimezone =
    trimmed.endsWith("Z") || /[+-]\d{2}(?::?\d{2})?$/.test(trimmed);
  const normalized = hasTimezone ? trimmed : `${trimmed}Z`;
  return new Date(normalized).getTime();
}

/** Relative reset countdown from an ISO timestamp. */
export function formatCountdown(
  isoString: string | null | undefined,
  nowMs: number,
  style: CountdownStyle = "long",
): string {
  if (!isoString) return "Resets soon";
  const target = parseUtcMs(isoString);
  if (Number.isNaN(target)) return "Resets soon";
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

/** Precise ticking countdown with seconds (e.g. "03h 42m 15s" or "4d 02h 15m 30s"). */
export function formatPreciseCountdown(
  isoString: string | null | undefined,
  nowMs: number,
): { formatted: string; isExpired: boolean; totalSeconds: number } {
  if (!isoString)
    return { formatted: "Resets soon", isExpired: true, totalSeconds: 0 };
  const target = parseUtcMs(isoString);
  const diff = target - nowMs;
  if (diff <= 0 || Number.isNaN(diff)) {
    return { formatted: "Resets soon", isExpired: true, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${String(hours).padStart(2, "0")}h`);
  parts.push(`${String(minutes).padStart(2, "0")}m`);
  parts.push(`${String(seconds).padStart(2, "0")}s`);

  return { formatted: parts.join(" "), isExpired: false, totalSeconds };
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

  const rawReset6h = str(profile?.resetAt) || str(raw?.reset_at);
  const rawResetWeekly =
    str(profile?.weeklyResetAt) || str(raw?.weekly_reset_at);

  const is6hExpired = rawReset6h ? parseUtcMs(rawReset6h) <= nowMs : false;
  const isWeeklyExpired = rawResetWeekly
    ? parseUtcMs(rawResetWeekly) <= nowMs
    : false;

  const pct6h = is6hExpired ? 0 : num(profile?.pct6h ?? raw?.pct_6h, 0);
  const pctWeekly = isWeeklyExpired
    ? 0
    : num(profile?.pctWeekly ?? raw?.pct_weekly, 0);

  const reset6hText = is6hExpired
    ? "Resets soon"
    : str(profile?.resetCountdown6h) ||
      str(raw?.reset_countdown_6h) ||
      formatCountdown(rawReset6h, nowMs, countdownStyle);

  const resetWeeklyText = isWeeklyExpired
    ? "Resets soon"
    : str(profile?.resetCountdownWeekly) ||
      str(raw?.reset_countdown_weekly) ||
      formatCountdown(rawResetWeekly, nowMs, countdownStyle);

  return {
    pct6h,
    reset6hText,
    pctWeekly,
    resetWeeklyText,
  };
}

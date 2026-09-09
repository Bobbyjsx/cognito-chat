import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatCountdown,
  formatPreciseCountdown,
  getQuotaSnapshot,
} from "../src/lib/quota";
import type { UserProfile } from "../src/types";

describe("Quota Reset & Expiration Handling", () => {
  const fixedNow = new Date("2026-09-09T21:19:18.000Z").getTime();

  it("should dynamically zero pct6h when resetAt timestamp is in the past", () => {
    // User manually set reset_at in DB to a past time (e.g. 09:15:00Z when now is 21:19:18Z)
    const profile: UserProfile = {
      id: "u123",
      email: "test@example.com",
      resetAt: "2026-09-09T09:15:00.000000Z",
      pct6h: 100, // Profile cache might still say 100%
      resetCountdown6h: "Resets soon",
      weeklyResetAt: "2026-09-16T21:19:18.000Z",
      pctWeekly: 30,
      resetCountdownWeekly: "resets in 7d",
    };

    const snapshot = getQuotaSnapshot(profile, fixedNow);

    // Because resetAt has passed, pct6h must be 0, unblocking the user immediately
    assert.equal(snapshot.pct6h, 0);
    assert.equal(snapshot.pctWeekly, 30);
    assert.equal(snapshot.reset6hText, "Resets soon");
  });

  it("should dynamically zero pctWeekly when weeklyResetAt timestamp is in the past", () => {
    const profile: UserProfile = {
      id: "u123",
      email: "test@example.com",
      resetAt: "2026-09-09T23:19:18.000Z",
      pct6h: 50,
      resetCountdown6h: "resets in 2h",
      weeklyResetAt: "2026-09-09T09:15:00.000000Z", // Expired weekly reset
      pctWeekly: 100,
      resetCountdownWeekly: "Resets soon",
    };

    const snapshot = getQuotaSnapshot(profile, fixedNow);
    assert.equal(snapshot.pct6h, 50);
    assert.equal(snapshot.pctWeekly, 0);
    assert.equal(snapshot.resetWeeklyText, "Resets soon");
  });

  it("should retain active percentages when reset timestamps are in the future", () => {
    const profile: UserProfile = {
      id: "u123",
      email: "test@example.com",
      resetAt: "2026-09-09T23:19:18.000Z", // 2 hours in future
      pct6h: 85,
      resetCountdown6h: "resets in 2h 0m",
      weeklyResetAt: "2026-09-16T21:19:18.000Z",
      pctWeekly: 40,
      resetCountdownWeekly: "resets in 7d",
    };

    const snapshot = getQuotaSnapshot(profile, fixedNow);
    assert.equal(snapshot.pct6h, 85);
    assert.equal(snapshot.pctWeekly, 40);
  });

  it("should report isExpired: true in formatPreciseCountdown when timestamp has passed", () => {
    const pastIso = "2026-09-09T09:15:00.000000Z";
    const countdown = formatPreciseCountdown(pastIso, fixedNow);

    assert.equal(countdown.isExpired, true);
    assert.equal(countdown.formatted, "Resets soon");
    assert.equal(countdown.totalSeconds, 0);
  });

  it("should format active ticking countdown when timestamp is in the future", () => {
    // 1 hour, 30 minutes, 15 seconds in future
    const futureMs = fixedNow + (1 * 3600 + 30 * 60 + 15) * 1000;
    const futureIso = new Date(futureMs).toISOString();

    const countdown = formatPreciseCountdown(futureIso, fixedNow);
    assert.equal(countdown.isExpired, false);
    assert.equal(countdown.formatted, "01h 30m 15s");
    assert.equal(countdown.totalSeconds, 5415);
  });

  it("should treat timestamps without timezone designator as UTC consistently", () => {
    // Both with Z and without Z must yield the exact same UTC millisecond timestamp
    const withZ = "2026-09-09T09:15:00.000000Z";
    const withoutZ = "2026-09-09T09:15:00";
    const withOffset = "2026-09-09T09:15:00+00:00";

    const cdWithZ = formatPreciseCountdown(withZ, fixedNow);
    const cdWithoutZ = formatPreciseCountdown(withoutZ, fixedNow);
    const cdWithOffset = formatPreciseCountdown(withOffset, fixedNow);

    assert.equal(cdWithZ.isExpired, true);
    assert.equal(cdWithoutZ.isExpired, true);
    assert.equal(cdWithOffset.isExpired, true);
  });
});

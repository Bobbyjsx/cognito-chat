import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../src/app/api/auth/oauth/authorize/route";
import {
  parseInFlightOAuth,
  appendInFlightOAuth,
  type OAuthStateEntry,
} from "../src/lib/auth/oauth-manager";
import { NextRequest } from "next/server";

describe("Authorize Route & Prefetch Safety", () => {
  it("should return 204 No Content for Next.js prefetch requests and never redirect", async () => {
    const prefetchHeaders: Record<string, string>[] = [
      { purpose: "prefetch" },
      { "sec-purpose": "prefetch" },
      { "x-purpose": "prefetch" },
      { "next-router-prefetch": "1" },
      { "x-nextjs-prefetch": "1" },
    ];

    for (const headers of prefetchHeaders) {
      const req = new NextRequest(
        "http://localhost:3000/api/auth/oauth/authorize",
        {
          headers,
        },
      );

      const res = await GET(req);
      assert.equal(
        res.status,
        204,
        `Failed for header ${JSON.stringify(headers)}`,
      );
      assert.equal(res.headers.get("location"), null);
    }
  });

  it("should return JSON with redirectUrl on intentional authorize call", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/auth/oauth/authorize",
      {
        headers: {
          host: "localhost:3000",
        },
      },
    );

    const res = await GET(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(typeof data.redirectUrl === "string");
    assert.ok(data.redirectUrl.includes("redirect_uri="));

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie?.includes("oauth_in_flight="));
  });
});

describe("Multi-Session PKCE In-Flight Storage", () => {
  it("should parse and filter expired entries correctly", () => {
    const now = Date.now();
    const expired: OAuthStateEntry[] = [
      { s: "expired_state", v: "verifier_1", exp: now - 1000 },
      { s: "valid_state", v: "verifier_2", exp: now + 60000 },
    ];

    const parsed = parseInFlightOAuth(JSON.stringify(expired));
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].s, "valid_state");
    assert.equal(parsed[0].v, "verifier_2");
  });

  it("should append new in-flight state without removing valid existing states", () => {
    const now = Date.now();
    const initial: OAuthStateEntry[] = [
      { s: "state_tab_1", v: "verifier_tab_1", exp: now + 300000 },
    ];

    const updated = appendInFlightOAuth(
      initial,
      "state_tab_2",
      "verifier_tab_2",
    );
    assert.equal(updated.length, 2);
    assert.equal(
      updated.find((x) => x.s === "state_tab_1")?.v,
      "verifier_tab_1",
    );
    assert.equal(
      updated.find((x) => x.s === "state_tab_2")?.v,
      "verifier_tab_2",
    );
  });

  it("should cap in-flight entries to max 5 to prevent cookie bloat", () => {
    let list: OAuthStateEntry[] = [];
    for (let i = 1; i <= 8; i++) {
      list = appendInFlightOAuth(list, `state_${i}`, `verifier_${i}`);
    }

    assert.equal(list.length, 5);
    assert.equal(list[list.length - 1].s, "state_8");
    assert.equal(list[0].s, "state_4");
  });
});

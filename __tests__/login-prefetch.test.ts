import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../src/app/(auth)/login/route";
import { NextRequest } from "next/server";

describe("Login Route & Prefetch Safety", () => {
  it("should return 204 No Content for Next.js prefetch requests and never redirect", async () => {
    const prefetchHeaders: Record<string, string>[] = [
      { purpose: "prefetch" },
      { "sec-purpose": "prefetch" },
      { "x-purpose": "prefetch" },
      { "next-router-prefetch": "1" },
      { "x-nextjs-prefetch": "1" },
    ];

    for (const headers of prefetchHeaders) {
      const req = new NextRequest("http://localhost:3000/login", {
        headers,
      });

      const res = await GET(req);
      assert.equal(
        res.status,
        204,
        `Failed for header ${JSON.stringify(headers)}`,
      );
      assert.equal(res.headers.get("location"), null);
    }
  });

  it("should return 307/308 redirect with OAuth authorize URL on intentional user visit", async () => {
    const req = new NextRequest("http://localhost:3000/login", {
      headers: {
        host: "localhost:3000",
      },
    });

    const res = await GET(req);
    assert.ok(res.status === 307 || res.status === 302 || res.status === 308);
    const location = res.headers.get("location");
    assert.ok(location?.includes("/api/v1/oauth/authorize"));
    assert.ok(location?.includes("redirect_uri="));
  });
});

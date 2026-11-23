import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GET } from "../src/app/(auth)/oauth/callback/route";
import { NextRequest } from "next/server";

describe("OAuth Callback Route Handler", () => {
  it("should redirect to /login with error when provider returns an error", async () => {
    const req = new NextRequest(
      "http://localhost:3000/oauth/callback?error=access_denied&error_description=User%20cancelled",
    );
    const res = await GET(req);

    assert.equal(res.status, 307);
    const location = res.headers.get("location")!;
    assert.ok(location.includes("/login"));
    const parsed = new URL(location);
    assert.equal(parsed.searchParams.get("error"), "User cancelled");
  });

  it("should redirect to /login when code or state is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/oauth/callback?code=only_code",
    );
    const res = await GET(req);

    assert.equal(res.status, 307);
    const location = res.headers.get("location")!;
    assert.ok(location.includes("/login"));
    const parsed = new URL(location);
    assert.equal(
      parsed.searchParams.get("error"),
      "Missing authentication code or state parameter.",
    );
  });

  it("should redirect to /login when in-flight cookie is missing or state does not match", async () => {
    const req = new NextRequest(
      "http://localhost:3000/oauth/callback?code=some_code&state=non_matching_state",
    );
    const res = await GET(req);

    assert.equal(res.status, 307);
    const location = res.headers.get("location")!;
    assert.ok(location.includes("/login"));
    const parsed = new URL(location);
    assert.equal(
      parsed.searchParams.get("error"),
      "Invalid or expired login session. Please try logging in again.",
    );
  });
});

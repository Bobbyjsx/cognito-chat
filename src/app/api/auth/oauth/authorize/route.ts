import {
  OAuthTransitionManager,
  appendInFlightOAuth,
  parseInFlightOAuth,
} from "@/lib/auth/oauth-manager";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("sec-purpose") === "prefetch" ||
    request.headers.get("x-purpose") === "prefetch" ||
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("x-nextjs-prefetch") === "1";

  if (isPrefetch) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  const oauthManager = new OAuthTransitionManager();
  const host = request.headers.get("host") || "localhost:3000";
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/oauth/callback`;

  const { url, state, codeVerifier } =
    await oauthManager.generateAuthorizeUrl(redirectUri);

  let redirectTarget = url.startsWith("http")
    ? url
    : new URL(url, request.url).toString();

  // Fast path: resolve the identity transaction redirect server-side so the browser
  // executes only a single direct hop, bypassing an intermediate browser redirect hop and TLS round-trip.
  try {
    const res = await fetch(redirectTarget, {
      redirect: "manual",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(1500),
    });
    const loc = res.headers.get("location");
    if (
      loc &&
      (res.status === 301 ||
        res.status === 302 ||
        res.status === 307 ||
        res.status === 308)
    ) {
      redirectTarget = loc;
    }
  } catch {
    // Non-blocking fallback: redirect browser to authorize url if fast-path times out
  }

  const returnTo =
    request.nextUrl.searchParams.get("callbackUrl") ||
    request.nextUrl.searchParams.get("returnTo") ||
    undefined;

  const existingInFlight = parseInFlightOAuth(
    request.cookies.get("oauth_in_flight")?.value,
  );
  const updatedInFlight = appendInFlightOAuth(
    existingInFlight,
    state,
    codeVerifier,
    10 * 60 * 1000,
    returnTo,
  );

  const response = NextResponse.json({
    success: true,
    redirectUrl: redirectTarget,
  });

  response.cookies.set("oauth_in_flight", JSON.stringify(updatedInFlight), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return response;
}

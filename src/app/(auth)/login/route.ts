import { OAuthTransitionManager } from "@/lib/auth/oauth-manager";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Prevent Next.js link prefetching from generating PKCE state and calling OAuth authorize
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

  const redirectTarget = url.startsWith("http")
    ? url
    : new URL(url, request.url).toString();

  const response = NextResponse.redirect(redirectTarget);
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("oauth_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}

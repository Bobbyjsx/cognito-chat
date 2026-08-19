import { OAuthTransitionManager } from "@/lib/auth/oauth-manager";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const oauthManager = new OAuthTransitionManager();
  const host = request.headers.get("host") || "localhost:3000";
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/oauth/callback`;

  const { url, state, codeVerifier } =
    await oauthManager.generateAuthorizeUrl(redirectUri);

  const response = NextResponse.redirect(url);
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

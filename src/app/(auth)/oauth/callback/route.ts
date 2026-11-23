import { type NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import {
  OAuthTransitionManager,
  parseInFlightOAuth,
} from "@/lib/auth/oauth-manager";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const urlError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // 1. Handle errors or user cancellation from identity server
  if (urlError || errorDescription) {
    const errorMsg =
      errorDescription ||
      urlError ||
      "Sign-in was cancelled or encountered an error.";
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", errorMsg);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Validate mandatory OAuth callback params
  if (!code || !state) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "error",
      "Missing authentication code or state parameter.",
    );
    return NextResponse.redirect(loginUrl);
  }

  // 3. Match in-flight session from cookie
  const inFlightRaw = request.cookies.get("oauth_in_flight")?.value;
  const inFlight = parseInFlightOAuth(inFlightRaw);
  const matched = inFlight.find((item) => item.s === state);
  const returnTo = matched?.r;

  const legacyState = request.cookies.get("oauth_state")?.value;
  const legacyVerifier = request.cookies.get("oauth_code_verifier")?.value;

  let codeVerifier: string | undefined = matched?.v;
  if (!codeVerifier && legacyState === state && legacyVerifier) {
    codeVerifier = legacyVerifier;
  }

  if (!codeVerifier) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "error",
      "Invalid or expired login session. Please try logging in again.",
    );
    return NextResponse.redirect(loginUrl);
  }

  try {
    const oauthManager = new OAuthTransitionManager();
    const host = request.headers.get("host") || "localhost:3000";
    const protocol =
      request.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");
    const redirectUri = `${protocol}://${host}/oauth/callback`;

    // 4. Perform token exchange using native fetch
    const result = await oauthManager.exchangeToken({
      code,
      codeVerifier,
      redirectUri,
    });

    if (!result.tokens || !result.user) {
      throw new Error("Missing tokens or user from exchange");
    }

    const { tokens, user } = result;

    // 5. Build NextAuth session JWT
    const isSecure =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https" ||
      process.env.NODE_ENV === "production";

    const sessionCookieName = isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const sessionPayload = {
      sub: user.id || (user as { sub?: string }).sub,
      name: user.name,
      email: user.email,
      user: {
        id: user.id || (user as { sub?: string }).sub,
        email: user.email,
        name: user.name,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpires: Date.now() + 900 * 1000,
    };

    const secret = process.env.AUTH_SECRET!;
    const encodedToken = await encode({
      token: sessionPayload,
      secret,
      salt: sessionCookieName,
    });

    // 6. Resolve destination
    let targetPath = "/chat";
    if (returnTo) {
      try {
        const parsed = new URL(returnTo, request.url);
        if (parsed.origin === request.nextUrl.origin) {
          targetPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        // Fallback to /chat on parse error
      }
    }

    const redirectResponse = NextResponse.redirect(
      new URL(targetPath, request.url),
    );

    // 7. Set secure session cookies
    redirectResponse.cookies.set(sessionCookieName, encodedToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: isSecure,
      maxAge: 30 * 24 * 60 * 60,
    });

    if (isSecure) {
      const nonSecureToken = await encode({
        token: sessionPayload,
        secret,
        salt: "authjs.session-token",
      });
      redirectResponse.cookies.set("authjs.session-token", nonSecureToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    // 8. Clean up redeemed in-flight cookies
    const remaining = inFlight.filter((item) => item.s !== state);
    if (remaining.length > 0) {
      redirectResponse.cookies.set(
        "oauth_in_flight",
        JSON.stringify(remaining),
        {
          httpOnly: true,
          secure: isSecure,
          path: "/",
          maxAge: 60 * 10,
          sameSite: "lax",
        },
      );
    } else {
      redirectResponse.cookies.delete("oauth_in_flight");
    }

    redirectResponse.cookies.delete("oauth_state");
    redirectResponse.cookies.delete("oauth_code_verifier");

    redirectResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate",
    );

    return redirectResponse;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("OAuth Callback Error:", message);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "error",
      "Failed to secure session. Please try logging in again.",
    );
    return NextResponse.redirect(loginUrl);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

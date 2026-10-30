import { type NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import {
  OAuthTransitionManager,
  parseInFlightOAuth,
} from "@/lib/auth/oauth-manager";

export const dynamic = "force-dynamic";

interface ExchangeCacheEntry {
  tokens: {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
  };
  user: {
    id: string;
    email?: string;
    name?: string;
  };
  returnTo?: string;
  timestamp: number;
}

const serverInFlightExchanges = new Map<
  string,
  Promise<{
    tokens: ExchangeCacheEntry["tokens"] | null;
    user: ExchangeCacheEntry["user"] | null;
    returnTo?: string;
    error: string | null;
  }>
>();
const serverExchangeCache = new Map<string, ExchangeCacheEntry>();

function cleanExpiredServerCache() {
  const now = Date.now();
  for (const [key, entry] of serverExchangeCache.entries()) {
    if (now - entry.timestamp > 60 * 1000) {
      serverExchangeCache.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: { code?: string; state?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty if params in URL
    }

    const searchParams = request.nextUrl.searchParams;
    const code = body.code || searchParams.get("code");
    const state = body.state || searchParams.get("state");
    const urlError = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (urlError || errorDescription || !code || !state) {
      const errorMsg =
        errorDescription ||
        urlError ||
        "Invalid or missing OAuth session parameters.";
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 400 },
      );
    }

    cleanExpiredServerCache();

    // 1. Check in-flight deduplication and cache
    let exchangeResult = serverExchangeCache.get(code);

    if (!exchangeResult) {
      let inFlightPromise = serverInFlightExchanges.get(code);
      if (!inFlightPromise) {
        inFlightPromise = (async () => {
          const inFlightRaw = request.cookies.get("oauth_in_flight")?.value;
          const inFlight = parseInFlightOAuth(inFlightRaw);
          const matched = inFlight.find((item) => item.s === state);
          const returnTo = matched?.r;

          const legacyState = request.cookies.get("oauth_state")?.value;
          const legacyVerifier = request.cookies.get(
            "oauth_code_verifier",
          )?.value;

          let codeVerifier: string | undefined = matched?.v;
          if (!codeVerifier && legacyState === state && legacyVerifier) {
            codeVerifier = legacyVerifier;
          }

          if (!codeVerifier) {
            return {
              tokens: null,
              user: null,
              returnTo: undefined,
              error:
                "Invalid or expired login session. Please try logging in again.",
            };
          }

          const oauthManager = new OAuthTransitionManager();
          const host = request.headers.get("host") || "localhost:3000";
          const protocol =
            request.headers.get("x-forwarded-proto") ||
            (host.includes("localhost") ? "http" : "https");
          const redirectUri = `${protocol}://${host}/oauth/callback`;

          const result = await oauthManager.exchangeToken({
            code,
            codeVerifier,
            redirectUri,
          });

          if (!result.tokens || !result.user) {
            throw new Error("Missing tokens or user from exchange");
          }

          serverExchangeCache.set(code, {
            tokens: result.tokens,
            user: result.user,
            returnTo,
            timestamp: Date.now(),
          });

          return {
            tokens: result.tokens,
            user: result.user,
            returnTo,
            error: null,
          };
        })();

        serverInFlightExchanges.set(code, inFlightPromise);
      }

      try {
        const resolved = await inFlightPromise;
        if (resolved.error || !resolved.tokens || !resolved.user) {
          throw new Error(
            resolved.error || "Failed to complete authentication exchange.",
          );
        }
        exchangeResult = {
          tokens: resolved.tokens,
          user: resolved.user,
          returnTo: resolved.returnTo,
          timestamp: Date.now(),
        };
      } finally {
        serverInFlightExchanges.delete(code);
      }
    }

    const { tokens, user, returnTo } = exchangeResult;

    // 2. Prepare NextAuth Session Token Payload
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

    const targetPath =
      returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : "/chat";

    const response = NextResponse.json({
      success: true,
      returnTo: targetPath,
    });

    // 3. Set Session Cookies
    response.cookies.set(sessionCookieName, encodedToken, {
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
      response.cookies.set("authjs.session-token", nonSecureToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    // 4. Clean up redeemed in-flight cookies
    const inFlightRaw = request.cookies.get("oauth_in_flight")?.value;
    const inFlight = parseInFlightOAuth(inFlightRaw);
    const remaining = inFlight.filter((item) => item.s !== state);
    if (remaining.length > 0) {
      response.cookies.set("oauth_in_flight", JSON.stringify(remaining), {
        httpOnly: true,
        secure: isSecure,
        path: "/",
        maxAge: 60 * 10,
        sameSite: "lax",
      });
    } else {
      response.cookies.delete("oauth_in_flight");
    }

    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_code_verifier");

    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate",
    );
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("OAuth Exchange Error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

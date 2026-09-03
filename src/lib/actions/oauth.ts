"use server";

import {
  OAuthTransitionManager,
  parseInFlightOAuth,
} from "@/lib/auth/oauth-manager";
import { cookies } from "next/headers";

export async function initiateOAuth() {
  const oauthManager = new OAuthTransitionManager();
  const redirectUri = await oauthManager.getOAuthRedirectURI();
  await oauthManager.authorize(redirectUri);
}

// In-flight deduplication & short-lived token exchange cache to safely absorb duplicate/replayed requests
interface ExchangeCacheEntry {
  tokens: unknown;
  user: unknown;
  timestamp: number;
}

const serverInFlightExchanges = new Map<
  string,
  Promise<{ tokens: unknown; user: unknown; error: string | null }>
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

export async function completeOAuthLogin(code: string, state: string) {
  try {
    // 1. Check if this code was already successfully exchanged within the last 60 seconds
    cleanExpiredServerCache();
    const cached = serverExchangeCache.get(code);
    if (cached) {
      return { tokens: cached.tokens, user: cached.user, error: null };
    }

    // 2. Check if this code is currently being exchanged concurrently
    const inFlightPromise = serverInFlightExchanges.get(code);
    if (inFlightPromise) {
      return await inFlightPromise;
    }

    const cookieStore = await cookies();
    const inFlightRaw = cookieStore.get("oauth_in_flight")?.value;
    const inFlight = parseInFlightOAuth(inFlightRaw);

    const matched = inFlight.find((item) => item.s === state);

    // Fallback check for legacy single-slot cookies
    const legacyState = cookieStore.get("oauth_state")?.value;
    const legacyVerifier = cookieStore.get("oauth_code_verifier")?.value;

    let codeVerifier: string | undefined = matched?.v;
    if (!codeVerifier && legacyState === state && legacyVerifier) {
      codeVerifier = legacyVerifier;
    }

    if (!codeVerifier) {
      throw new Error(
        "Invalid or expired login session. Please try logging in again.",
      );
    }

    const oauthManager = new OAuthTransitionManager();
    const redirectUri = await oauthManager.getOAuthRedirectURI();

    // Execute token exchange with in-flight lock to deduplicate concurrent requests
    const exchangeExecution = (async () => {
      try {
        const result = await oauthManager.exchangeToken({
          code,
          codeVerifier,
          redirectUri,
        });

        // Store in short-lived cache so immediate duplicate calls reuse the tokens
        serverExchangeCache.set(code, {
          tokens: result.tokens,
          user: result.user,
          timestamp: Date.now(),
        });

        return { tokens: result.tokens, user: result.user, error: null };
      } finally {
        serverInFlightExchanges.delete(code);
      }
    })();

    serverInFlightExchanges.set(code, exchangeExecution);
    const { tokens, user, error } = await exchangeExecution;

    if (error) {
      return { tokens: null, user: null, error };
    }

    // Remove the redeemed state from in-flight list
    const remaining = inFlight.filter((item) => item.s !== state);
    if (remaining.length > 0) {
      cookieStore.set("oauth_in_flight", JSON.stringify(remaining), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 10,
        sameSite: "lax",
      });
    } else {
      cookieStore.delete("oauth_in_flight");
    }

    // Clean up legacy cookies if present
    cookieStore.delete("oauth_state");
    cookieStore.delete("oauth_code_verifier");

    return { tokens, user, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("completeOAuthLogin error:", message);
    return { tokens: null, user: null, error: message };
  }
}

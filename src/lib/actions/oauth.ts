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

export async function completeOAuthLogin(code: string, state: string) {
  try {
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

    const { tokens, user } = await oauthManager.exchangeToken({
      code,
      codeVerifier,
      redirectUri,
    });

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

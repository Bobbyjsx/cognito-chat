"use server";

import { OAuthTransitionManager } from "@/lib/auth/oauth-manager";
import { cookies } from "next/headers";

export async function initiateOAuth() {
  const oauthManager = new OAuthTransitionManager();
  const redirectUri = await oauthManager.getOAuthRedirectURI();
  await oauthManager.authorize(redirectUri);
}

export async function completeOAuthLogin(code: string, state: string) {
  try {
    const cookieStore = await cookies();
    const savedState = cookieStore.get("oauth_state")?.value;
    const codeVerifier = cookieStore.get("oauth_code_verifier")?.value;

    if (state !== savedState) {
      throw new Error("Invalid state. Please try logging in again.");
    }

    if (!codeVerifier) {
      throw new Error("Missing code verifier. Please try logging in again.");
    }

    const oauthManager = new OAuthTransitionManager();
    const redirectUri = await oauthManager.getOAuthRedirectURI();

    const { tokens, user } = await oauthManager.exchangeToken({
      code,
      codeVerifier,
      redirectUri,
    });

    // Clear cookies
    cookieStore.delete("oauth_state");
    cookieStore.delete("oauth_code_verifier");

    return { tokens, user, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("completeOAuthLogin error:", message);
    return { tokens: null, user: null, error: message };
  }
}

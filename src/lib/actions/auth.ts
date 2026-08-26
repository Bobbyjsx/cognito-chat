"use server";

import { unstable_update } from "@/auth";
import { OAuthTransitionManager } from "@/lib/auth/oauth-manager";
import { cookies } from "next/headers";

export async function exchangeOAuthToken(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const oauthManager = new OAuthTransitionManager();
  return oauthManager.exchangeToken(params);
}

/**
 * Server-side session refresh action (invokes NextAuth update).
 */
export async function refreshSession() {
  return unstable_update({ forceRefresh: true });
}

/**
 * Server-side session logout action to remove cookies.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("authjs.session-token");
  cookieStore.delete("__Secure-authjs.session-token");
  return { success: true };
}

/**
 * Updates the NextAuth session cookie with refreshed tokens received from FastAPI response headers.
 */
export async function updateSessionTokens(params: {
  accessToken: string;
  refreshToken?: string;
}) {
  return unstable_update({
    user: {
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
    },
  });
}

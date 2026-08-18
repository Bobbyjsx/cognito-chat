"use server";

import { unstable_update } from "@/auth";
import { OAuthTransitionManager } from "@/lib/auth/oauth-manager";

export async function exchangeOAuthToken(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const oauthManager = new OAuthTransitionManager();
  return oauthManager.exchangeToken(params);
}

/**
 * Forces the NextAuth jwt callback to re-run the token refresh flow.
 * Call this from client-side code when a 401 is received to attempt
 * a silent token renewal before the session-expired dialog appears.
 */
export async function refreshSession() {
  return unstable_update({ forceRefresh: true });
}

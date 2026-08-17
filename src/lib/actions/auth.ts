"use server";

import { OAuthTransitionManager } from "@/lib/auth/oauth-manager";

export async function exchangeOAuthToken(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const oauthManager = new OAuthTransitionManager();
  return oauthManager.exchangeToken(params);
}

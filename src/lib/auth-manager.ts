import {
  AuthManager,
  authManager,
  type AuthSession,
  type TokenPair,
  type RequestHeaderConfig,
} from "@bobslab/auth";

// Configure NextAuth session resolver for client-side and server-side contexts
authManager.setSessionResolver(async () => {
  if (typeof window !== "undefined") {
    const { getSession } = await import("next-auth/react");
    const session = await getSession({ broadcast: false });
    return session as AuthSession | null;
  }
  try {
    const { auth } = await import("@/auth");
    return (await auth()) as AuthSession | null;
  } catch {
    return null;
  }
});

// Configure NextAuth cookie token synchronization for token refresh cycles
authManager.setTokenSyncHandler(async ({ accessToken, refreshToken }) => {
  if (typeof window !== "undefined") {
    try {
      const { updateSessionTokens } = await import("@/lib/actions/auth");
      await updateSessionTokens({
        accessToken,
        refreshToken,
      });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("Background token sync warning:", err);
      }
    }
  }
});

// Ensure clearing session cache also resets in-memory token state
const originalClear = authManager.clearBrowserSessionCache.bind(authManager);
authManager.clearBrowserSessionCache = () => {
  authManager.setTokens(null);
  originalClear();
};

export {
  authManager,
  AuthManager,
  type AuthSession,
  type TokenPair,
  type RequestHeaderConfig,
};

import type { InternalAxiosRequestConfig } from "axios";
import { Analytics } from "./analytics";

export interface AuthSession {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    accessToken?: string;
    refreshToken?: string;
  };
}

type CachedSession = {
  session: AuthSession | null;
  expiresAt: number;
};

const BROWSER_SESSION_CACHE_TTL_MS = 60_000;
const EMPTY_BROWSER_SESSION_CACHE_TTL_MS = 10_000;

export class AuthManager {
  private browserSessionCache: CachedSession | null = null;
  private browserSessionPromise: Promise<AuthSession | null> | null = null;

  clearBrowserSessionCache() {
    this.browserSessionCache = null;
    this.browserSessionPromise = null;
  }

  /**
   * Updates cached tokens immediately in-memory and asynchronously updates NextAuth session cookie.
   */
  async updateTokens(newAccessToken: string, newRefreshToken?: string) {
    if (!newAccessToken) return;

    const current = this.browserSessionCache?.session;

    // Skip the expensive unstable_update server action if the token hasn't
    // actually changed. Every API response that carries x-new-access-token was
    // calling updateSessionTokens() → unstable_update(), which invalidates the
    // RSC cache and causes Next.js to re-render all server components (e.g.
    // AuthGate on /settings), triggering more API calls — creating an infinite loop.
    const existingAccessToken =
      current?.accessToken || current?.user?.accessToken;
    if (
      newAccessToken === existingAccessToken &&
      (!newRefreshToken ||
        newRefreshToken ===
          (current?.refreshToken || current?.user?.refreshToken))
    ) {
      return;
    }

    const updatedSession: AuthSession = {
      ...current,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken || current?.refreshToken,
      user: current?.user
        ? {
            ...current.user,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || current.user.refreshToken,
          }
        : undefined,
    };

    this.browserSessionCache = {
      session: updatedSession,
      expiresAt: Date.now() + BROWSER_SESSION_CACHE_TTL_MS,
    };

    if (typeof window !== "undefined") {
      try {
        const { updateSessionTokens } = await import("@/lib/actions/auth");
        await updateSessionTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
      } catch (err) {
        logger_debug_error(err);
      }
    }
  }

  private async getBrowserSession(): Promise<AuthSession | null> {
    const now = Date.now();
    if (this.browserSessionCache && this.browserSessionCache.expiresAt > now) {
      return this.browserSessionCache.session;
    }

    this.browserSessionPromise ??= import("next-auth/react")
      // broadcast: false — prevents getSession() from posting a BroadcastChannel
      // message. Without this, every axios request (which calls getBrowserSession)
      // would broadcast "session" → SessionProvider's storage listener fires →
      // _getSession({ event: "storage" }) always re-fetches /api/auth/session →
      // which triggers more React Query refetches → more axios requests → infinite loop.
      .then(({ getSession }) => getSession({ broadcast: false }))
      .then((nextSession) => {
        const session = nextSession as AuthSession | null;
        this.browserSessionCache = {
          session,
          expiresAt:
            Date.now() +
            (session
              ? BROWSER_SESSION_CACHE_TTL_MS
              : EMPTY_BROWSER_SESSION_CACHE_TTL_MS),
        };
        return session;
      })
      .finally(() => {
        this.browserSessionPromise = null;
      });

    return this.browserSessionPromise;
  }

  private async getServerSession(): Promise<AuthSession | null> {
    try {
      const { auth } = await import("@/auth");
      return (await auth()) as AuthSession | null;
    } catch {
      return null;
    }
  }

  async getAuthSession(): Promise<AuthSession | null> {
    try {
      if (this.browserSessionCache?.session) {
        return this.browserSessionCache.session;
      }
      if (typeof window === "undefined") {
        return await this.getServerSession();
      }
      return await this.getBrowserSession();
    } catch (error) {
      if (process.env.NODE_ENV !== "test") {
        console.error("Failed to resolve auth session:", error);
        Analytics.captureError(error);
      }
      return null;
    }
  }

  /**
   * Applies the Bearer token and X-Refresh-Token to outgoing requests to FastAPI backend.
   */
  async applyAuthTokenToReq(config: InternalAxiosRequestConfig) {
    const session = await this.getAuthSession();
    if (!session) return;

    config.headers = config.headers ?? {};

    const accessToken = session.accessToken || session.user?.accessToken;
    const refreshToken = session.refreshToken || session.user?.refreshToken;

    if (accessToken) {
      if (typeof config.headers.set === "function") {
        config.headers.set("Authorization", `Bearer ${accessToken}`);
      } else {
        (config.headers as Record<string, string>)["Authorization"] =
          `Bearer ${accessToken}`;
      }
    }

    if (refreshToken) {
      if (typeof config.headers.set === "function") {
        config.headers.set("X-Refresh-Token", refreshToken);
      } else {
        (config.headers as Record<string, string>)["X-Refresh-Token"] =
          refreshToken;
      }
    }
  }
}

function logger_debug_error(err: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("Background session token sync non-critical warning:", err);
  }
}

export const authManager = new AuthManager();

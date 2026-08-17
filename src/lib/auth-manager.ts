import type { InternalAxiosRequestConfig } from "axios";
import { Analytics } from "./analytics";

interface AuthSession {
  accessToken?: string;
  user?: {
    refreshToken?: string;
    refresh_token?: string;
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

  private async getBrowserSession(): Promise<AuthSession | null> {
    const now = Date.now();
    if (this.browserSessionCache && this.browserSessionCache.expiresAt > now) {
      return this.browserSessionCache.session;
    }

    this.browserSessionPromise ??= import("next-auth/react")
      .then(({ getSession }) => getSession())
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
    const { auth } = await import("@/auth");
    return (await auth()) as AuthSession | null;
  }

  async getAuthSession(): Promise<AuthSession | null> {
    try {
      if (typeof window === "undefined") {
        return await this.getServerSession();
      }
      return await this.getBrowserSession();
    } catch (error) {
      console.error("Failed to resolve auth session:", error);
      Analytics.captureError(error);
      return null;
    }
  }

  async applyAuthTokenToReq(config: InternalAxiosRequestConfig) {
    const session = await this.getAuthSession();
    if (!session?.accessToken) return;

    config.headers = config.headers ?? {};
    if (typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${session.accessToken}`);
    } else {
      (config.headers as Record<string, string>)["Authorization"] =
        `Bearer ${session.accessToken}`;
    }
  }
}

export const authManager = new AuthManager();

import axios, { type InternalAxiosRequestConfig } from "axios";
import { Analytics } from "./analytics";
import { API_BASE_URL } from "./api-config";
import { authManager } from "./auth-manager";
import { keysToCamel, keysToSnake } from "./case-transform";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Set to true to skip fetching and attaching the NextAuth session token */
    isAuthReq?: boolean;
    _retry?: boolean;
  }
}

export const baseURL = API_BASE_URL;

export const api = axios.create({
  baseURL,
});

/** Safely sets a header, handling both AxiosHeaders and plain objects */
function setHeader(
  config: InternalAxiosRequestConfig,
  key: string,
  value: string,
) {
  config.headers = config.headers ?? {};
  if (typeof config.headers.set === "function") {
    config.headers.set(key, value);
  } else {
    (config.headers as Record<string, string>)[key] = value;
  }
}

/** Formats request payload and params to snake_case */
function transformToSnakeCase(config: InternalAxiosRequestConfig) {
  if (config.data) {
    config.data = keysToSnake(config.data);
  }
  if (config.params) {
    config.params = keysToSnake(config.params);
  }
}

// -----------------------------------------------------------------------------
// Request Interceptor
// -----------------------------------------------------------------------------
api.interceptors.request.use(
  async (config) => {
    if (!config.isAuthReq) {
      await authManager.applyAuthTokenToReq(config);
    }
    transformToSnakeCase(config);

    return config;
  },
  (error) => {
    Analytics.captureApiError(error, error.config?.url, error.config?.method);
    if (
      typeof window !== "undefined" &&
      (error as { response?: { status?: number } }).response?.status === 401
    ) {
      authManager.clearBrowserSessionCache();
    }
    return Promise.reject(error);
  },
);

// -----------------------------------------------------------------------------
// Response Interceptor
// -----------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = keysToCamel(response.data);
    }
    return response;
  },
  async (error) => {
    Analytics.captureApiError(error, error.config?.url, error.config?.method);

    const originalRequest = error.config;

    // Handle 401 Unauthorized globally
    if (error.response?.status === 401 && originalRequest) {
      // If we haven't retried yet and this isn't an auth endpoint (prevent loops)
      if (!originalRequest._retry && !originalRequest.url?.includes("/auth/")) {
        originalRequest._retry = true;

        try {
          if (typeof window !== "undefined") {
            // Client-side: use standard fetch to NextAuth session endpoint to force update
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ data: { forceRefresh: true } }),
            });
            authManager.clearBrowserSessionCache();
          } else {
            // Server-side: use unstable_update exported from our auth.ts
            const { unstable_update } = await import("@/auth");
            await unstable_update({ forceRefresh: true });
          }

          // Fetch the new session
          const newSession = await authManager.getAuthSession();

          if (newSession?.accessToken) {
            // Apply the new token directly to the original request
            if (typeof originalRequest.headers.set === "function") {
              originalRequest.headers.set(
                "Authorization",
                `Bearer ${newSession.accessToken}`,
              );
            } else {
              originalRequest.headers["Authorization"] =
                `Bearer ${newSession.accessToken}`;
            }

            // Retry the request with the new token
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error(
            "Token refresh failed during Axios retry:",
            refreshError,
          );
        }
      }

      // If we get here, it means we either:
      // 1. Already retried once and failed again
      // 2. Refresh token attempt threw an error
      // 3. Failed on an /auth/ endpoint directly
      authManager.clearBrowserSessionCache();
      if (typeof window !== "undefined") {
        const { signOut } = await import("next-auth/react");
        signOut({ callbackUrl: "/login" });
      }
    }

    return Promise.reject(error);
  },
);

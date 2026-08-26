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
let lastMutationTime = 0;

/**
 * Manually mark a mutation when native fetch or SDKs bypass Axios
 */
export function markGlobalMutation() {
  lastMutationTime = Date.now();
}

api.interceptors.request.use(
  async (config) => {
    if (!config.isAuthReq) {
      await authManager.applyAuthTokenToReq(config);
    }
    transformToSnakeCase(config);

    const method = config.method?.toLowerCase();

    // Track when a mutation occurs via Axios
    if (method && ["post", "put", "patch", "delete"].includes(method)) {
      lastMutationTime = Date.now();
    } else if (method === "get") {
      // If a mutation happened in the last 2.5 seconds, force bypass HTTP cache
      if (Date.now() - lastMutationTime < 2500) {
        setHeader(config, "Cache-Control", "no-cache");
        setHeader(config, "Pragma", "no-cache");
      }
    }

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
    // 1. Intercept transparent token refresh headers from FastAPI server
    const newAccessToken = response.headers["x-new-access-token"] as
      string | undefined;
    const newRefreshToken = response.headers["x-new-refresh-token"] as
      string | undefined;

    if (newAccessToken) {
      void authManager.updateTokens(newAccessToken, newRefreshToken);
    }

    // 2. Transform response payload keys to camelCase
    if (response.data) {
      response.data = keysToCamel(response.data);
    }
    return response;
  },
  async (error) => {
    if (!axios.isCancel(error) && error.name !== "CanceledError") {
      Analytics.captureApiError(error, error.config?.url, error.config?.method);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      authManager.clearBrowserSessionCache();
      if (typeof window !== "undefined") {
        const { signOut } = await import("next-auth/react");
        signOut({ callbackUrl: "/login" });
      }
    }

    return Promise.reject(error);
  },
);

import axios, { type InternalAxiosRequestConfig } from "axios";
import { Analytics } from "./analytics";
import {
  API_BASE_URL,
  ATLAS_API_KEY_HEADER,
  getAtlasApiKey,
} from "./api-config";
import { keysToCamel, keysToSnake } from "./case-transform";

interface AuthSession {
  accessToken?: string;
  user?: {
    refreshToken?: string;
    refresh_token?: string;
  };
}

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Set to true to skip fetching and attaching the NextAuth session token */
    isAuthReq?: boolean;
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

/** Injects KeySentry Atlas API key into request headers */
function applyAtlasKey(config: InternalAxiosRequestConfig) {
  const atlasKey = getAtlasApiKey();
  if (atlasKey) {
    setHeader(config, ATLAS_API_KEY_HEADER, atlasKey);
  }
}

/** Injects NextAuth Bearer token into request headers */
async function applyAuthToken(config: InternalAxiosRequestConfig) {
  // Skip session fetch for requests marked as auth requests
  if (config.isAuthReq) return;

  try {
    let session: AuthSession | null = null;
    if (typeof window === "undefined") {
      const { auth } = await import("@/auth");
      session = (await auth()) as AuthSession | null;
    } else {
      const { getSession } = await import("next-auth/react");
      session = (await getSession()) as AuthSession | null;
    }

    if (session?.accessToken) {
      setHeader(config, "Authorization", `Bearer ${session.accessToken}`);
    }
  } catch (e) {
    console.error("Failed to attach auth headers in Axios interceptor:", e);
    Analytics.captureError(e);
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
    applyAtlasKey(config);
    await applyAuthToken(config);
    transformToSnakeCase(config);

    return config;
  },
  (error) => {
    Analytics.captureApiError(error, error.config?.url, error.config?.method);
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
  (error) => {
    Analytics.captureApiError(error, error.config?.url, error.config?.method);
    return Promise.reject(error);
  },
);

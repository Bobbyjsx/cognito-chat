import axios, { type InternalAxiosRequestConfig } from "axios";
import { Analytics } from "./analytics";
import {
  API_BASE_URL,
  ATLAS_API_KEY_HEADER,
  getAtlasApiKey,
} from "./api-config";
import { authManager } from "./auth-manager";
import { keysToCamel, keysToSnake } from "./case-transform";

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
    if (!config.isAuthReq) {
      await authManager.applyAuthToken(config);
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
  (error) => {
    Analytics.captureApiError(error, error.config?.url, error.config?.method);
    return Promise.reject(error);
  },
);

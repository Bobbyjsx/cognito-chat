import axios, { type InternalAxiosRequestConfig } from "axios";
import { Analytics } from "./analytics";
import {
  getOAuthClientId,
  OAUTH_APP_ID_HEADER,
  OAUTH_BASE_URL,
} from "./api-config";
import { keysToCamel, keysToSnake } from "./case-transform";

export const oauthBaseURL = OAUTH_BASE_URL;

export const oauthApi = axios.create({
  baseURL: oauthBaseURL,
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

/** Injects Application tenant ID and Atlas API key */
function applyHeaders(config: InternalAxiosRequestConfig) {
  const appId = getOAuthClientId();
  if (appId) {
    setHeader(config, OAUTH_APP_ID_HEADER, appId);
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
oauthApi.interceptors.request.use(
  (config) => {
    applyHeaders(config);
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
oauthApi.interceptors.response.use(
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

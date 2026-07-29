import axios, { InternalAxiosRequestConfig } from "axios";
import {
  API_BASE_URL,
  ATLAS_API_KEY_HEADER,
  getAtlasApiKey,
} from "./api-config";
import { keysToCamel, keysToSnake } from "./case-transform";

export const baseURL = API_BASE_URL;

// Main API client
export const api = axios.create({
  baseURL,
});

// Dedicated client for token refresh to avoid recursive interceptor loops
const refreshClient = axios.create({
  baseURL,
});

export interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface AuthSession {
  accessToken?: string;
  user?: {
    refreshToken?: string;
    refresh_token?: string;
  };
}

/** Match KeySentry: use AxiosHeaders.set when available. */
function applyAtlasKey(config: InternalAxiosRequestConfig) {
  const atlasKey = getAtlasApiKey();
  if (!atlasKey) return;

  config.headers = config.headers ?? {};
  const headers = config.headers as {
    set?: (name: string, value: string) => void;
    [key: string]: unknown;
  };

  if (typeof headers.set === "function") {
    headers.set(ATLAS_API_KEY_HEADER, atlasKey);
  } else {
    headers[ATLAS_API_KEY_HEADER] = atlasKey;
  }
}

api.interceptors.request.use(
  async (config) => {
    try {
      applyAtlasKey(config);

      let session: AuthSession | null = null;
      if (typeof window === "undefined") {
        const { auth } = await import("@/auth");
        session = (await auth()) as AuthSession | null;
      } else {
        const { getSession } = await import("next-auth/react");
        session = (await getSession()) as AuthSession | null;
      }
      const token = session?.accessToken;

      config.headers = config.headers || {};

      if (token) {
        const headers = config.headers as {
          set?: (name: string, value: string) => void;
          Authorization?: string;
        };
        if (typeof headers.set === "function") {
          headers.set("Authorization", `Bearer ${token}`);
        } else {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      if (config.data) {
        config.data = keysToSnake(config.data);
      }
      if (config.params) {
        config.params = keysToSnake(config.params);
      }
    } catch (e) {
      console.error("Failed to attach auth headers in Axios interceptor:", e);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

refreshClient.interceptors.request.use((config) => {
  applyAtlasKey(config);
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = keysToCamel(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as RetryAxiosRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let session: AuthSession | null = null;
        if (typeof window === "undefined") {
          const { auth } = await import("@/auth");
          session = (await auth()) as AuthSession | null;
        } else {
          const { getSession } = await import("next-auth/react");
          session = (await getSession()) as AuthSession | null;
        }

        const refreshToken =
          session?.user?.refreshToken || session?.user?.refresh_token;

        if (refreshToken) {
          const res = await refreshClient.post(`/auth/refresh`, {
            refresh_token: refreshToken,
          });

          if (res.data?.access_token) {
            const newAccessToken = res.data.access_token;
            const newRefreshToken = res.data.refresh_token || refreshToken;

            const newSessionData = {
              user: {
                ...session?.user,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              },
            };

            if (typeof window === "undefined") {
              const { unstable_update } = await import("@/auth");
              if (typeof unstable_update === "function" && session) {
                await unstable_update(newSessionData);
              }
            } else {
              await fetch("/api/auth/session", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ data: newSessionData }),
              });
              const event = new Event("visibilitychange");
              document.dispatchEvent(event);
            }

            processQueue(null, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        console.error("Token refresh failed in interceptor.");
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

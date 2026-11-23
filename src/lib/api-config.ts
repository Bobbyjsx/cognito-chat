export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

/** Absolute URL under the API base (leading slash optional). */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

/**
 * OAuth Base URL. Defaults directly to API_BASE_URL since the unified API gateway
 * routes /api/v1/oauth/*, /api/v1/auth/*, and /.well-known/* to the Identity Service.
 * Preserves optional override via NEXT_PUBLIC_OAUTH_SERVICE_URL for isolated testing.
 */
export const OAUTH_BASE_URL =
  process.env.NEXT_PUBLIC_OAUTH_SERVICE_URL?.replace(/\/$/, "") || API_BASE_URL;

export const OAUTH_APP_ID_HEADER = "X-Application-Id";

/** Application client ID / tenant key registered with OAuth Service */
export const OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || "";

export function getOAuthClientId(): string {
  return OAUTH_CLIENT_ID.trim().replace(/^["']|["']$/g, "");
}

export function oauthUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${OAUTH_BASE_URL}${normalized}`;
}

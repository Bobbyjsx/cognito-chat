/**
 * Backend / Atlas gateway configuration.
 *
 * Atlas routes services as: `{ATLAS_ORIGIN}/{service}/{path}`
 * e.g. https://atlas.example.com/cognito/auth/login
 *
 * Set NEXT_PUBLIC_API_URL to the full service base (including /cognito when
 * going through the gateway). Set ATLAS_API_KEY server-side only — never
 * expose it with NEXT_PUBLIC_*.
 */

/** Cognito service base URL (direct API or Atlas-prefixed). */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

/** Server-only key for Atlas gateway. Empty when calling the API directly. */
export const ATLAS_API_KEY = process.env.ATLAS_API_KEY || "";

/** Canonical header name (HTTP is case-insensitive; gateway reads x-atlas-api-key). */
export const ATLAS_API_KEY_HEADER = "X-Atlas-Api-Key";

/**
 * Headers required to reach Atlas (and optional extras).
 * Safe to call on server; on client ATLAS_API_KEY is unset so no key is sent.
 */
export function atlasHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (ATLAS_API_KEY) {
    headers[ATLAS_API_KEY_HEADER] = ATLAS_API_KEY;
  }
  return headers;
}

/** Absolute URL under the API base (leading slash optional). */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

/**
 * Backend / Atlas gateway configuration.
 *
 * Atlas routes: `{gateway}/{service}/{path}`
 * Cognito example: `https://atlas.example.com/cognito/auth/login`
 *
 * Gateway checks header `X-Atlas-Api-Key` against env `API_KEY_COGNITO`
 * (GSM secret: `api-key-cognito`). User JWT still goes in `Authorization`.
 *
 * Env (either name works; prefer server-only `ATLAS_API_KEY` when possible):
 * - NEXT_PUBLIC_API_URL — service base, must include `/cognito` on Atlas
 * - ATLAS_API_KEY or NEXT_PUBLIC_ATLAS_API_KEY — must equal gateway API_KEY_COGNITO
 */

/** Cognito service base URL (direct API or Atlas-prefixed). */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

/** Canonical header name (HTTP is case-insensitive). */
export const ATLAS_API_KEY_HEADER = "X-Atlas-Api-Key";

/**
 * Resolve Atlas API key from env.
 * Trims whitespace/quotes (common Vercel secret pitfalls).
 * Accepts both ATLAS_API_KEY and NEXT_PUBLIC_ATLAS_API_KEY.
 */
export function getAtlasApiKey(): string {
  const raw =
    process.env.ATLAS_API_KEY ||
    process.env.NEXT_PUBLIC_ATLAS_API_KEY ||
    "";
  return raw.trim().replace(/^["']|["']$/g, "");
}

/** True when API base looks like an Atlas service path for cognito. */
export function isAtlasCognitoUrl(url: string = API_BASE_URL): boolean {
  try {
    const pathname = new URL(url).pathname.replace(/\/$/, "");
    return pathname === "/cognito" || pathname.endsWith("/cognito");
  } catch {
    return url.includes("/cognito");
  }
}

/**
 * Headers required to reach Atlas (+ optional extras).
 * Always set X-Atlas-Api-Key when a key is configured.
 */
export function atlasHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const key = getAtlasApiKey();
  if (key) {
    headers[ATLAS_API_KEY_HEADER] = key;
  }
  return headers;
}

/** Absolute URL under the API base (leading slash optional). */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

/** Safe debug snapshot (never logs the full key). */
export function atlasDebugInfo(): {
  baseUrl: string;
  hasKey: boolean;
  keyLength: number;
  looksLikeAtlasCognito: boolean;
} {
  const key = getAtlasApiKey();
  return {
    baseUrl: API_BASE_URL,
    hasKey: key.length > 0,
    keyLength: key.length,
    looksLikeAtlasCognito: isAtlasCognitoUrl(),
  };
}

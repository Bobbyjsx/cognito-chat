import { OAUTH_BASE_URL, OAUTH_CLIENT_ID } from "@/lib/api-config";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export interface OAuthStateEntry {
  s: string; // state
  v: string; // code_verifier
  exp: number; // expiration timestamp (ms)
  r?: string; // returnTo callback URL
}

export function parseInFlightOAuth(raw: string | undefined): OAuthStateEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (item) =>
        item &&
        typeof item.s === "string" &&
        typeof item.v === "string" &&
        typeof item.exp === "number" &&
        item.exp > now,
    );
  } catch {
    return [];
  }
}

export function appendInFlightOAuth(
  existing: OAuthStateEntry[],
  state: string,
  codeVerifier: string,
  ttlMs = 10 * 60 * 1000,
  returnTo?: string,
): OAuthStateEntry[] {
  const now = Date.now();
  const valid = existing.filter((item) => item.exp > now && item.s !== state);
  const entry: OAuthStateEntry = {
    s: state,
    v: codeVerifier,
    exp: now + ttlMs,
  };
  if (returnTo) {
    entry.r = returnTo;
  }
  const updated = [...valid, entry];
  // Keep maximum 5 most recent in-flight flows to prevent cookie bloat
  return updated.slice(-5);
}

export class OAuthTransitionManager {
  private generateRandomString(length: number): string {
    const array = new Uint32Array(length / 2);
    crypto.getRandomValues(array);
    return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join(
      "",
    );
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(
      String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async generateAuthorizeUrl(redirectUri: string): Promise<{
    url: string;
    state: string;
    codeVerifier: string;
  }> {
    const state = this.generateRandomString(16);
    const codeVerifier = this.generateRandomString(43);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: "openid email profile",
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const baseUrl = OAUTH_BASE_URL.replace(/\/$/, "");

    return {
      url: `${baseUrl}/api/v1/oauth/authorize?${params.toString()}`,
      state,
      codeVerifier,
    };
  }

  async authorize(redirectUri: string, returnTo?: string) {
    const { url, state, codeVerifier } =
      await this.generateAuthorizeUrl(redirectUri);

    const cookieStore = await cookies();
    const existingInFlight = parseInFlightOAuth(
      cookieStore.get("oauth_in_flight")?.value,
    );
    const updatedInFlight = appendInFlightOAuth(
      existingInFlight,
      state,
      codeVerifier,
      10 * 60 * 1000,
      returnTo,
    );

    cookieStore.set("oauth_in_flight", JSON.stringify(updatedInFlight), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
      sameSite: "lax",
    });

    redirect(url);
  }

  async exchangeToken(params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }) {
    const baseUrl = OAUTH_BASE_URL.replace(/\/$/, "");
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: OAUTH_CLIENT_ID,
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
    });

    if (process.env.OAUTH_CLIENT_SECRET) {
      body.append("client_secret", process.env.OAUTH_CLIENT_SECRET);
    }

    let tokens: {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
      [key: string]: unknown;
    };
    try {
      const tokenRes = await fetch(`${baseUrl}/api/v1/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: body.toString(),
      });
      const data = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(JSON.stringify(data));
      }
      tokens = data;
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : String(err);
      console.error("Token Exchange Error:", errorText);
      throw new Error(`Failed to exchange token: ${errorText}`);
    }

    let user: { id: string; email?: string; name?: string } | null = null;

    // Fast path: Extract user profile directly from id_token without a second HTTP round-trip
    if (tokens && typeof tokens.id_token === "string") {
      try {
        const parts = tokens.id_token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString("utf-8"),
          );
          const id = payload?.sub || payload?.id;
          if (typeof id === "string" && id.trim()) {
            user = {
              id: id.trim(),
              email: payload.email,
              name: payload.name || payload.preferred_username,
            };
          }
        }
      } catch (parseErr) {
        console.warn(
          "Failed to parse id_token claims, falling back to /auth/me:",
          parseErr,
        );
      }
    }

    // Fallback: If id_token was missing or could not be parsed, fetch /auth/me
    if (!user) {
      try {
        const userRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            Accept: "application/json",
          },
        });
        if (!userRes.ok) {
          const errData = await userRes.text();
          throw new Error(errData);
        }
        user = await userRes.json();
      } catch (err: unknown) {
        const errorText = err instanceof Error ? err.message : String(err);
        console.error("Fetch User Profile Error:", errorText);
        throw new Error(`Failed to fetch user profile: ${errorText}`);
      }
    }

    if (!user) {
      throw new Error("Failed to resolve user profile from identity provider");
    }

    return {
      tokens,
      user: user as { id: string; email?: string; name?: string },
    };
  }

  async getOAuthRedirectURI() {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol =
      headersList.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");

    return `${protocol}://${host}/oauth/callback`;
  }
}

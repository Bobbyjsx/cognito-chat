import { OAUTH_BASE_URL, OAUTH_CLIENT_ID } from "@/lib/api-config";
import axios from "axios";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

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
      scope: "email profile",
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return {
      url: `${OAUTH_BASE_URL}/api/v1/oauth/authorize?${params.toString()}`,
      state,
      codeVerifier,
    };
  }

  async authorize(redirectUri: string) {
    const { url, state, codeVerifier } =
      await this.generateAuthorizeUrl(redirectUri);

    const cookieStore = await cookies();
    cookieStore.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
    cookieStore.set("oauth_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    redirect(url);
  }

  async exchangeToken(params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }) {
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

    let tokens;
    try {
      const tokenRes = await axios.post(
        `${OAUTH_BASE_URL}/api/v1/oauth/token`,
        body,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      tokens = tokenRes.data;
    } catch (err: unknown) {
      const errorText =
        axios.isAxiosError(err) && err.response?.data
          ? JSON.stringify(err.response.data)
          : err instanceof Error
            ? err.message
            : String(err);
      console.error("Token Exchange Error:", errorText);
      throw new Error(`Failed to exchange token: ${errorText}`);
    }

    let user;
    try {
      const userRes = await axios.get(`${OAUTH_BASE_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });
      user = userRes.data;
    } catch {
      throw new Error("Failed to fetch user profile");
    }

    return { tokens, user };
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

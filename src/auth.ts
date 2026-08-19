import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Analytics } from "@/lib/analytics";
import { oauthApi } from "@/lib/oauth-api";
import { OAUTH_CLIENT_ID } from "@/lib/api-config";

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: "manual-oauth",
      name: "Manual OAuth",
      credentials: {
        accessToken: { label: "Access Token", type: "text" },
        refreshToken: { label: "Refresh Token", type: "text" },
        userStr: { label: "User JSON", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.accessToken || !credentials?.userStr) {
          return null;
        }

        try {
          const user = JSON.parse(credentials.userStr as string);
          return {
            id: user.id || user.sub,
            email: user.email,
            name: user.name,
            accessToken: credentials.accessToken as string,
            refreshToken: credentials.refreshToken as string,
          };
        } catch (err) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      // 1. Initial login: user is returned from authorize()
      if (user && account) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;

        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
        };
        // Assume default 15 minutes
        token.accessTokenExpires = Date.now() + 900 * 1000;

        if (token.error) {
          delete token.error;
        }

        return token;
      }

      // 2. Client manual trigger updates
      if (trigger === "update" && session) {
        if (session.forceRefresh) {
          token.accessTokenExpires = 0; // Force it to expire so it falls through to the refresh block
        } else if (session.user) {
          token.user = {
            ...(token.user as Record<string, unknown>),
            ...session.user,
          };
          if (session.user.accessToken) {
            token.accessToken = session.user.accessToken;
            token.accessTokenExpires = Date.now() + 14 * 60 * 1000;
          }
          if (session.user.refreshToken) {
            token.refreshToken = session.user.refreshToken;
          }
          if (token.error) {
            delete token.error;
          }
        }
        // If forceRefresh was true, we DO NOT return token here, we let it fall through to step 4!
        if (!session.forceRefresh) {
          return token;
        }
      }

      // 3. Return previous token if it has not expired yet
      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() < token.accessTokenExpires
      ) {
        if (token.error) {
          delete token.error;
        }
        return token;
      }

      // 4. Access token has expired -> attempt to refresh it automatically via refresh_token
      try {
        if (!token.refreshToken) {
          return { ...token, error: "RefreshAccessTokenError" };
        }

        const body = new URLSearchParams({
          grant_type: "refresh_token",
          client_id: OAUTH_CLIENT_ID,
          refresh_token: token.refreshToken as string,
        });

        if (process.env.OAUTH_CLIENT_SECRET) {
          body.append("client_secret", process.env.OAUTH_CLIENT_SECRET);
        }

        const res = await oauthApi.post("/api/v1/oauth/token", body, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        const refreshedTokens = res.data;

        const { error, ...tokenWithoutError } = token;

        return {
          ...tokenWithoutError,
          accessToken: refreshedTokens.accessToken,
          accessTokenExpires: Date.now() + 14 * 60 * 1000,
          refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
        };
      } catch (error) {
        console.error(
          "Error refreshing access token in NextAuth jwt callback:",
          error,
        );
        Analytics.captureError(error, { context: "NextAuth jwt refresh" });
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    },
    async session({ session, token }) {
      if (token?.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      if (token?.user) {
        session.user = token.user as unknown as typeof session.user;
      }
      if (token?.error) {
        (session as unknown as { error?: string }).error =
          token.error as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

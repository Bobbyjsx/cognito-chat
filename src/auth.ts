import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Analytics } from "@/lib/analytics";
import { oauthApi } from "@/lib/oauth-api";

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
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      // 1. Initial login: user is returned from authorize()
      if (user && account) {
        token.accessToken = (
          user as unknown as { accessToken: string }
        ).accessToken;
        token.refreshToken = (
          user as unknown as { refreshToken: string }
        ).refreshToken;

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

      // 2. Client manual trigger updates (e.g. after FastAPI rotated tokens)
      if (trigger === "update" && session) {
        if (session.forceRefresh) {
          token.accessTokenExpires = 0;
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

      // 4. Fallback refresh if expired
      try {
        if (!token.refreshToken) {
          return { ...token, error: "RefreshAccessTokenError" };
        }

        const res = await oauthApi.post("/api/v1/auth/refresh", {
          refreshToken: token.refreshToken,
        });

        const refreshedTokens = res.data;

        return {
          ...token,
          accessToken: refreshedTokens.accessToken,
          accessTokenExpires: Date.now() + 14 * 60 * 1000,
          refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
          error: undefined,
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
      if (token?.refreshToken) {
        session.refreshToken = token.refreshToken as string;
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

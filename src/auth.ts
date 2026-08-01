import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Analytics } from "@/lib/analytics";
import { api } from "@/lib/axios";

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  // Required when AUTH_URL is unset / behind Cloudflare's reverse proxy.
  // CF_PAGES is auto-detected by Auth.js, but explicit trustHost is safer.
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await api.post(
            "/auth/login",
            {
              email: credentials.email,
              password: credentials.password,
            },
            { isAuthReq: true },
          );

          const tokens = res.data;

          // Fetch user profile info using access token
          let userProfile = null;
          try {
            const profileRes = await api.get("/auth/me", {
              headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
              },
              isAuthReq: true,
            });
            userProfile = profileRes.data;
          } catch (e) {
            console.error("Failed to fetch profile during auth:", e);
            Analytics.captureError(e, {
              context: "Auth profile fetch",
              email: credentials?.email,
            });
          }

          return {
            id: userProfile?.id || tokens.accessToken,
            email: userProfile?.email || (credentials.email as string),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokensUsed: userProfile?.tokensUsed ?? 0,
            tokenLimit: userProfile?.tokenLimit ?? 50000,
          };
        } catch (error: any) {
          console.error("Auth authorize error:", error);
          if (error.response?.status === 401) {
            Analytics.captureEvent(error, {
              context: "Auth login failed",
              status: 401,
              email: credentials?.email,
            });
          } else {
            Analytics.captureError(error, {
              context: "Auth authorize",
              email: credentials?.email,
            });
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. Initial login: attach user and tokens to JWT
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.refreshToken = (user as { refreshToken?: string }).refreshToken;
        token.user = user as unknown as Record<string, unknown>;
        // Assume access token expires in 30 mins (1800 sec). Store absolute expiry timestamp in ms
        token.accessTokenExpires = Date.now() + 25 * 60 * 1000;
        return token;
      }

      // 2. Client manual trigger updates
      if (trigger === "update" && session) {
        if (session.user) {
          token.user = {
            ...(token.user as Record<string, unknown>),
            ...session.user,
          };
          if (session.user.accessToken) {
            token.accessToken = session.user.accessToken;
            token.accessTokenExpires = Date.now() + 25 * 60 * 1000;
          }
          if (session.user.refreshToken) {
            token.refreshToken = session.user.refreshToken;
          }
        }
        return token;
      }

      // 3. Return previous token if it has not expired yet
      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() < token.accessTokenExpires
      ) {
        return token;
      }

      // 4. Access token has expired -> attempt to refresh it automatically via refresh_token
      try {
        if (!token.refreshToken) {
          return { ...token, error: "RefreshAccessTokenError" };
        }

        const res = await api.post(
          "/auth/refresh",
          {
            refreshToken: token.refreshToken,
          },
          { isAuthReq: true },
        );

        const refreshedTokens = res.data;

        return {
          ...token,
          accessToken: refreshedTokens.accessToken,
          accessTokenExpires: Date.now() + 25 * 60 * 1000,
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
    error: "/api/auth/error",
  },
});

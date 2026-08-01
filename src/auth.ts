import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { apiUrl, atlasHeaders } from "@/lib/api-config";

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
          const res = await fetch(apiUrl("/auth/login"), {
            method: "POST",
            headers: atlasHeaders({
              "Content-Type": "application/json",
            }),
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const errorBody = await res.text().catch(() => "");
            console.error("Auth login failed", res.status, errorBody);
            return null;
          }

          const tokens = await res.json();

          // Fetch user profile info using access token
          let userProfile = null;
          try {
            const profileRes = await fetch(apiUrl("/auth/me"), {
              headers: atlasHeaders({
                Authorization: `Bearer ${tokens.access_token}`,
              }),
            });
            if (profileRes.ok) {
              userProfile = await profileRes.json();
            }
          } catch (e) {
            console.error("Failed to fetch profile during auth:", e);
          }

          return {
            id: userProfile?.id || tokens.access_token,
            email: userProfile?.email || (credentials.email as string),
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokensUsed: userProfile?.tokens_used ?? 0,
            tokenLimit: userProfile?.token_limit ?? 50000,
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
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

        const res = await fetch(apiUrl("/auth/refresh"), {
          method: "POST",
          headers: atlasHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            refresh_token: token.refreshToken,
          }),
        });

        const refreshedTokens = await res.json();

        if (!res.ok) {
          throw refreshedTokens;
        }

        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          accessTokenExpires: Date.now() + 25 * 60 * 1000,
          refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        };
      } catch (error) {
        console.error(
          "Error refreshing access token in NextAuth jwt callback:",
          error,
        );
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

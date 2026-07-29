import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const baseURL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

          const res = await fetch(`${baseURL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
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
            const profileRes = await fetch(`${baseURL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
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
      if (trigger === "update" && session) {
        if (session.user) {
          token.user = {
            ...(token.user as Record<string, unknown>),
            ...session.user,
          };
          if (session.user.accessToken) {
            token.accessToken = session.user.accessToken;
          }
        }
      }
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.user = user as unknown as Record<string, unknown>;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      if (token?.user) {
        session.user = token.user as unknown as typeof session.user;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

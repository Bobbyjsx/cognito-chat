import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    forceRefresh?: boolean;
    accessToken?: string;
    user?: {
      id?: string;
      email?: string | null;
      accessToken?: string;
      refreshToken?: string;
      tokensUsed?: number;
      tokenLimit?: number;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    tokensUsed?: number;
    tokenLimit?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    user?: Record<string, unknown>;
  }
}

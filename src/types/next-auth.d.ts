import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    forceRefresh?: boolean;
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id?: string;
      email?: string | null;
      accessToken?: string;
      refreshToken?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    user?: Record<string, unknown>;
  }
}

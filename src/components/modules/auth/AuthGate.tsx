import type { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";

export async function AuthGate({ children }: { children: ReactNode }) {
  await requireAuth();
  return children;
}

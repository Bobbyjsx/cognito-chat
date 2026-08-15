import type { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();
  return children;
}

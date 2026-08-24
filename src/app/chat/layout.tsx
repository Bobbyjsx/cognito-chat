import type { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";

export default async function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();
  return <div className="h-dvh overflow-hidden">{children}</div>;
}

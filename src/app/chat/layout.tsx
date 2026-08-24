import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";
import { noIndexRobots } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chat",
  robots: noIndexRobots,
};

export default async function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();
  return <div className="h-dvh overflow-hidden">{children}</div>;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";
import { noIndexRobots } from "@/lib/site";

export const metadata: Metadata = {
  title: "Library",
  robots: noIndexRobots,
};

export default async function LibraryLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();
  return <div className="h-dvh overflow-hidden">{children}</div>;
}

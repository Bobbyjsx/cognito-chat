import { noIndexRobots } from "@/lib/site";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Auth",
  robots: noIndexRobots,
};

export default function OAuthCallbackLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}

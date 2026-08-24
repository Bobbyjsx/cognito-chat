import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noIndexRobots } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in error",
  robots: noIndexRobots,
};

export default function AuthErrorLayout({ children }: { children: ReactNode }) {
  return children;
}

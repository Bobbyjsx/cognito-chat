import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AuthGate } from "@/components/modules/auth/AuthGate";
import { ChatShellLoading } from "@/components/loading/page-skeletons";
import { noIndexRobots } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chat",
  robots: noIndexRobots,
};

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden">
      <Suspense fallback={<ChatShellLoading />}>
        <AuthGate>{children}</AuthGate>
      </Suspense>
    </div>
  );
}

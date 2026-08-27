import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AuthGate } from "@/components/modules/auth/AuthGate";
import { RootLoading } from "@/components/loading/page-skeletons";
import { noIndexRobots } from "@/lib/site";

export const metadata: Metadata = {
  title: "Library",
  robots: noIndexRobots,
};

export default function LibraryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden">
      <Suspense fallback={<RootLoading />}>
        <AuthGate>{children}</AuthGate>
      </Suspense>
    </div>
  );
}

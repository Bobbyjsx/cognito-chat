import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AuthGate } from "@/components/modules/auth/AuthGate";
import { SettingsPageLoading } from "@/components/loading/page-skeletons";
import { noIndexRobots } from "@/lib/site";

export const metadata: Metadata = {
  title: "Settings",
  robots: noIndexRobots,
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden">
      <Suspense fallback={<SettingsPageLoading />}>
        <AuthGate>{children}</AuthGate>
      </Suspense>
    </div>
  );
}

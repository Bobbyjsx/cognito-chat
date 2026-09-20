import { Suspense } from "react";
import type { Metadata } from "next";
import { SettingsModule } from "@/components/modules/settings/SettingsModule";
import { SettingsPageLoading } from "@/components/loading/page-skeletons";
import { noIndexRobots } from "@/lib/site";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage account, plan, and usage settings",
  robots: noIndexRobots,
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageLoading />}>
      <SettingsModule />
    </Suspense>
  );
}

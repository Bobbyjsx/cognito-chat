import { Suspense } from "react";
import type { Metadata } from "next";
import { SettingsModule } from "@/components/modules/settings/SettingsModule";
import { SettingsPageLoading } from "@/components/loading/page-skeletons";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage account and token quota settings",
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageLoading />}>
      <SettingsModule />
    </Suspense>
  );
}

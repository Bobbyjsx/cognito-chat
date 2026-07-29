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
    <div className="flex h-screen overflow-hidden bg-background font-body-md text-body-md text-on-surface">
      <main className="relative flex h-screen min-w-0 flex-1 flex-col overflow-y-auto bg-background">
        <Suspense fallback={<SettingsPageLoading />}>
          <SettingsModule />
        </Suspense>
      </main>
    </div>
  );
}

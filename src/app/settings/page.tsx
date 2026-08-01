import { Suspense } from "react";
import type { Metadata } from "next";
import { SettingsModule } from "@/components/modules/settings/SettingsModule";
import { SettingsPageLoading } from "@/components/loading/page-skeletons";
import { ChatSidebar } from "@/components/modules/chat/ChatSidebar";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage account and token quota settings",
};

export default function SettingsPage() {
  return (
    <div className="bg-background font-body-md text-body-md text-on-surface flex h-dvh h-screen overflow-hidden">
      <ChatSidebar />
      <main className="bg-background relative flex h-dvh h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <Suspense fallback={<SettingsPageLoading />}>
          <SettingsModule />
        </Suspense>
      </main>
    </div>
  );
}

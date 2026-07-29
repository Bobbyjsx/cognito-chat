"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "@/components/modules/chat/ChatSidebar";
import { Navbar } from "@/components/modules/chat/Navbar";
const SettingsModule = dynamic(
  () =>
    import("@/components/modules/settings/SettingsModule").then(
      (m) => m.SettingsModule,
    ),
  {
    loading: () => (
      <div
        className="mx-auto w-full max-w-[800px] space-y-6 px-4 py-8 md:px-8"
        aria-busy="true"
        aria-label="Loading settings"
      >
        <div className="h-8 w-48 animate-pulse rounded-md bg-[rgba(0,0,0,0.06)]" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-[rgba(0,0,0,0.06)]" />
        <div className="h-48 w-full animate-pulse rounded-xl bg-[rgba(0,0,0,0.06)]" />
      </div>
    ),
    ssr: true,
  },
);

export default function SettingsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectSession = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleNewChat = () => {
    router.push("/chat");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body-md text-body-md text-on-surface">
      <ChatSidebar
        activeSessionId={null}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <main className="relative flex h-screen min-w-0 flex-1 flex-col overflow-y-auto bg-background">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <SettingsModule />
      </main>
    </div>
  );
}

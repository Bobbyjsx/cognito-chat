"use client";

import { LibraryGallery } from "@/components/modules/library/LibraryGallery";
import { ChatSidebar } from "@/components/modules/chat/ChatSidebar";
import { useState } from "react";

export default function LibraryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface flex h-full overflow-hidden">
      <ChatSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="bg-background relative flex h-full min-w-0 flex-1 flex-col">
        <LibraryGallery onMenuClick={() => setSidebarOpen(true)} />
      </main>
    </div>
  );
}

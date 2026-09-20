"use client";

import { Suspense, useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatSidebar } from "@/components/modules/chat/ChatSidebar";
import { LibraryGallery } from "@/components/modules/library/LibraryGallery";
import { PromptLibraryView } from "@/components/modules/library/PromptLibraryView";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, Sparkles } from "lucide-react";

type LibraryTab = "files" | "prompts";

function LibraryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab: LibraryTab =
    searchParams.get("tab") === "prompts" ? "prompts" : "files";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleTabChange = useCallback(
    (nextTab: string | number | null) => {
      if (!nextTab) return;
      const tabValue = String(nextTab) === "prompts" ? "prompts" : "files";
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (tabValue === "prompts") {
          params.set("tab", "prompts");
        } else {
          params.delete("tab");
        }
        const query = params.toString();
        router.replace(query ? `/library?${query}` : "/library", {
          scroll: false,
        });
      });
    },
    [router, searchParams],
  );

  const tabSwitcher = (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="inline-flex"
    >
      <TabsList className="bg-surface-container-low h-8 rounded-full border border-black/[0.04] p-0.5">
        <TabsTrigger
          value="files"
          className="data-active:text-on-surface gap-1.5 rounded-full px-3 py-1 text-xs font-medium data-active:bg-white data-active:font-semibold data-active:shadow-xs"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span>Files</span>
        </TabsTrigger>
        <TabsTrigger
          value="prompts"
          className="data-active:text-on-surface gap-1.5 rounded-full px-3 py-1 text-xs font-medium data-active:bg-white data-active:font-semibold data-active:shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Prompts</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface flex h-full overflow-hidden">
      <ChatSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="bg-background relative flex h-full min-w-0 flex-1 flex-col">
        {currentTab === "prompts" ? (
          <PromptLibraryView
            onMenuClick={() => setSidebarOpen(true)}
            headerTabs={tabSwitcher}
          />
        ) : (
          <LibraryGallery
            onMenuClick={() => setSidebarOpen(true)}
            headerTabs={tabSwitcher}
          />
        )}
      </main>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex h-full items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      }
    >
      <LibraryPageContent />
    </Suspense>
  );
}

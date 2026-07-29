"use client";

import dynamic from "next/dynamic";
import { ChatShellLoading } from "@/components/loading/page-skeletons";

/**
 * Client-side code-split entry for ChatShell.
 * Keeps the heavy chat client graph out of the initial server layout module graph
 * until this boundary hydrates.
 */
const ChatShell = dynamic(
  () =>
    import("@/components/modules/chat/ChatShell").then((m) => m.ChatShell),
  {
    loading: () => <ChatShellLoading />,
    ssr: true,
  },
);

export function ChatShellLoader() {
  return <ChatShell />;
}

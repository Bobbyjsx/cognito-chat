import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatShellLoader } from "@/components/modules/chat/ChatShellLoader";
import { ChatShellLoading } from "@/components/loading/page-skeletons";

export const metadata: Metadata = {
  title: "Chat",
  description: "Private Cognito chat sessions",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nosnippet: true,
    },
  },
};

/**
 * Chat shell lives in the layout so navigating /chat → /chat/[sessionId]
 * does not remount useChat and interrupt an in-flight stream.
 * ChatShellLoader code-splits the heavy client graph behind a loading UI.
 */
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ChatShellLoading />}>
      <ChatShellLoader />
      {/* Route segments exist for URL/state only; UI is owned by ChatShell. */}
      <div className="hidden" aria-hidden>
        {children}
      </div>
    </Suspense>
  );
}

export const runtime = "edge";

import type { Metadata } from "next";
import { ChatShell } from "@/components/modules/chat/ChatShell";

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

export default function ChatPage() {
  return <ChatShell />;
}

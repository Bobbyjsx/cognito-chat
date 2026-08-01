export const runtime = "edge";

import type { Metadata } from "next";

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

import { DynamicChatShell } from "@/components/modules/chat/ChatClient";

export default function ChatPage() {
  return <DynamicChatShell />;
}

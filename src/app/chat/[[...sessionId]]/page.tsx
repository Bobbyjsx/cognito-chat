import type { Metadata } from "next";
import { DynamicChatShell } from "@/components/modules/chat/ChatClient";
import { noIndexRobots } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chat",
  description: "Private Cognito chat sessions",
  robots: noIndexRobots,
};

export default function ChatPage() {
  return <DynamicChatShell />;
}

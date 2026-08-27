"use client";

import dynamic from "next/dynamic";
import { ChatShellLoading } from "@/components/loading/page-skeletons";

export const DynamicChatShell = dynamic(
  () => import("./ChatShell").then((m) => m.ChatShell),
  {
    ssr: false,
    loading: () => <ChatShellLoading />,
  },
);

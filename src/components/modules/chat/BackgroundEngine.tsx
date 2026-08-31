"use client";

import { useSession } from "next-auth/react";
import { useBackgroundGenerationsEngine } from "@/hooks/data/useChats/useBackgroundGenerationsEngine";

export function BackgroundEngine() {
  const { status } = useSession();

  if (status !== "authenticated") {
    return null;
  }

  return <BackgroundEngineInner />;
}

function BackgroundEngineInner() {
  useBackgroundGenerationsEngine();
  return null;
}

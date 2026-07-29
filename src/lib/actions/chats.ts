"use server";

import { api } from "@/lib/axios";
import type { ChatSession, ChatSessionListItem } from "@/types";
import { throwServerActionError } from "../server-error";

export async function getSessionsAction(): Promise<ChatSessionListItem[]> {
  try {
    const { data } = await api.get<ChatSessionListItem[]>("/agent/sessions");
    return data;
  } catch (err) {
    return throwServerActionError(err) as unknown as ChatSessionListItem[];
  }
}

export async function getSessionAction(
  sessionId: string,
): Promise<ChatSession> {
  try {
    const { data } = await api.get<ChatSession>(`/agent/sessions/${sessionId}`);
    return data;
  } catch (err) {
    return throwServerActionError(err) as unknown as ChatSession;
  }
}

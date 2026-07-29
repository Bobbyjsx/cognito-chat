"use server";

import { api } from "@/lib/axios";
import type { ChatSession, ChatSessionListItem } from "@/types";
import { throwServerActionError } from "../server-error";

export async function getSessionsAction(
  searchQuery?: string,
): Promise<ChatSessionListItem[]> {
  try {
    const qParam = searchQuery?.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : "";
    const { data } = await api.get<ChatSessionListItem[]>(`/agent/sessions${qParam}`);
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

export async function deleteSessionAction(
  sessionId: string,
): Promise<{ message: string }> {
  try {
    const { data } = await api.delete<{ message: string }>(`/agent/sessions/${sessionId}`);
    return data;
  } catch (err) {
    return throwServerActionError(err) as unknown as { message: string };
  }
}

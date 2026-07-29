"use server";

import { api } from "@/lib/axios";
import { throwServerActionError } from "../server-error";
import type { ChatResponse, ChatSession } from "@/types";

export async function sendChatMessageAction(
  message: string,
  sessionId?: string,
  model?: string,
  reasoning?: string
): Promise<ChatResponse> {
  try {
    const url = sessionId
      ? `/agent/chat?session_id=${sessionId}`
      : "/agent/chat";
    const { data } = await api.post<ChatResponse>(url, {
      message,
      model,
      reasoning,
    });
    return data;
  } catch (err) {
    return throwServerActionError(err) as unknown as ChatResponse;
  }
}

export async function getSessionsAction(): Promise<ChatSession[]> {
  try {
    const { data } = await api.get<ChatSession[]>("/agent/sessions");
    return data;
  } catch (err) {
    return throwServerActionError(err) as unknown as ChatSession[];
  }
}

export async function getSessionAction(
  sessionId: string
): Promise<ChatSession> {
  try {
    const { data } = await api.get<ChatSession>(`/agent/sessions/${sessionId}`);
    return data;
  } catch (err) {
    return throwServerActionError(err) as unknown as ChatSession;
  }
}

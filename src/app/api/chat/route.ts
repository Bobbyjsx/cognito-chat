import { auth } from "@/auth";
import { Analytics } from "@/lib/analytics";
import { apiUrl, atlasHeaders } from "@/lib/api-config";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import {
  extractTextFromMessage,
  MAX_MESSAGE_LENGTH,
  pipeBackendStreamToUIMessage,
  safeErrorDetail,
} from "@/lib/chat-stream";

function jsonError(detail: string, status: number, code?: string) {
  return new Response(JSON.stringify({ detail, ...(code ? { code } : {}) }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.accessToken) {
    return jsonError("Unauthorized", 401);
  }

  const body = await req.json();
  const { messages, model, reasoning, sessionId } = body as {
    messages?: unknown[];
    model?: string;
    reasoning?: string;
    sessionId?: string;
  };

  const lastMessage = extractTextFromMessage(
    Array.isArray(messages) ? messages[messages.length - 1] : undefined,
  );

  if (!lastMessage.trim()) {
    return jsonError("Message is empty", 400);
  }

  if (lastMessage.length > MAX_MESSAGE_LENGTH) {
    return jsonError(
      `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
      400,
    );
  }

  const path = sessionId
    ? `/agent/chat/stream?session_id=${encodeURIComponent(sessionId)}`
    : "/agent/chat/stream";
  const url = apiUrl(path);
  const startedAt = Date.now();

  Analytics.captureEvent("chat.stream.start", {
    model,
    reasoning,
    sessionId: sessionId || null,
  });

  let backendResponse: Response;
  try {
    backendResponse = await fetch(url, {
      method: "POST",
      headers: atlasHeaders({
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "text/event-stream",
      }),
      body: JSON.stringify({ message: lastMessage, model, reasoning }),
      signal: req.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      Analytics.captureEvent("chat.stream.aborted", {
        durationMs: Date.now() - startedAt,
      });
      return new Response(null, { status: 499 });
    }
    Analytics.captureApiError(err, url, "POST");
    return jsonError("Streaming request failed", 500);
  }

  if (!backendResponse.ok) {
    const errorText = await backendResponse.text();
    const error = safeErrorDetail(errorText, backendResponse.status);
    Analytics.captureApiError(
      new Error(`Chat stream upstream error: ${error.message}`),
      url,
      "POST",
      { code: error.code, status: backendResponse.status },
    );
    return jsonError(error.message, backendResponse.status, error.code);
  }

  if (!backendResponse.body) {
    Analytics.captureError(new Error("Chat stream returned an empty body"), {
      url,
    });
    return jsonError("Empty stream from backend", 502);
  }

  const backendBody = backendResponse.body;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      await pipeBackendStreamToUIMessage({
        reader: backendBody.getReader(),
        writer,
        signal: req.signal,
        startedAt,
      });
    },
    onError: (err) => {
      Analytics.captureApiError(err, url, "POST");
      return "Streaming request failed";
    },
  });

  return createUIMessageStreamResponse({ stream });
}

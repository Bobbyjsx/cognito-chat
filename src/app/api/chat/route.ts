import { auth } from "@/auth";
import { Analytics } from "@/lib/analytics";
import { api } from "@/lib/axios";
import {
  extractTextFromMessage,
  MAX_MESSAGE_LENGTH,
  pipeBackendStreamToUIMessage,
  safeErrorDetail,
} from "@/lib/chat-stream";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { Readable } from "stream";
import type { AxiosResponse } from "axios";

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
  const { messages, model, reasoning, sessionId, attachments } = body as {
    messages?: unknown[];
    model?: string;
    reasoning?: string;
    sessionId?: string;
    attachments?: string[];
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
  const startedAt = Date.now();

  Analytics.captureEvent("chat.stream.start", {
    model,
    reasoning,
    sessionId: sessionId || null,
  });

  let backendResponse: AxiosResponse<Readable>;
  try {
    backendResponse = await api.post<Readable>(
      path,
      {
        message: lastMessage,
        model,
        reasoning,
        ...(Array.isArray(attachments) && attachments.length > 0
          ? { attachments }
          : {}),
      },
      {
        responseType: "stream",
        validateStatus: () => true, // Prevent throwing on 4xx/5xx so we can parse error streams
        headers: {
          Accept: "text/event-stream",
        },
        signal: req.signal,
      },
    );
  } catch (err: any) {
    if (err.name === "CanceledError" || err.message?.includes("abort")) {
      Analytics.captureEvent("chat.stream.aborted", {
        durationMs: Date.now() - startedAt,
      });
      return new Response(null, { status: 499 });
    }
    Analytics.captureApiError(err, path, "POST");
    return jsonError("Streaming request failed", 500);
  }

  if (backendResponse.status >= 400) {
    // Read the stream to get the error text since responseType is stream
    const chunks: Buffer[] = [];
    try {
      for await (const chunk of backendResponse.data) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
    } catch (e) {
      // Ignore stream read errors on error responses
    }
    const errorText = Buffer.concat(chunks).toString("utf8");
    const error = safeErrorDetail(errorText, backendResponse.status);
    Analytics.captureApiError(
      new Error(`Chat stream upstream error: ${error.message}`),
      path,
      "POST",
      { code: error.code, status: backendResponse.status },
    );
    return jsonError(error.message, backendResponse.status, error.code);
  }

  if (!backendResponse.data) {
    Analytics.captureError(new Error("Chat stream returned an empty body"), {
      url: path,
    });
    return jsonError("Empty stream from backend", 502);
  }

  const backendBody = Readable.toWeb(
    backendResponse.data,
  ) as ReadableStream<Uint8Array>;

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
      Analytics.captureApiError(err, path, "POST");
      return "Streaming request failed";
    },
  });

  return createUIMessageStreamResponse({ stream });
}

import { auth } from "@/auth";
import { apiUrl, atlasHeaders } from "@/lib/api-config";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

const MAX_MESSAGE_LENGTH = 32_000;

/** AI SDK v5/v6 UI messages store text in `parts`, not top-level `content`. */
function extractTextFromMessage(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const m = message as {
    content?: unknown;
    parts?: Array<{ type?: string; text?: string }>;
  };

  if (typeof m.content === "string" && m.content.trim()) {
    return m.content;
  }

  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((p) => p?.type === "text" && typeof p.text === "string")
      .map((p) => p.text as string)
      .join("");
  }

  return "";
}

type BackendSseEvent = {
  event: string;
  data: string;
};

function parseSseBlock(block: string): BackendSseEvent | null {
  const lines = block.split("\n");
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

/** Map upstream error bodies to a short client-safe detail string. */
function safeErrorDetail(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (
      typeof parsed.detail === "string" &&
      parsed.detail.length > 0 &&
      parsed.detail.length <= 500 &&
      !parsed.detail.includes("Traceback") &&
      !parsed.detail.includes("File ")
    ) {
      return parsed.detail;
    }
  } catch {
    // non-JSON body
  }

  if (status === 401) return "Unauthorized";
  if (status === 403) return "Forbidden";
  if (status === 404) return "Not found";
  if (status === 422) return "Invalid request";
  if (status >= 500) return "Upstream service error";
  return "Request failed";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.accessToken) {
    return new Response(JSON.stringify({ detail: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(JSON.stringify({ detail: "Message is empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (lastMessage.length > MAX_MESSAGE_LENGTH) {
    return new Response(
      JSON.stringify({
        detail: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const streamPath = sessionId
    ? `/agent/chat/stream?session_id=${encodeURIComponent(sessionId)}`
    : "/agent/chat/stream";
  const url = apiUrl(streamPath);

  try {
    const backendResponse = await fetch(url, {
      method: "POST",
      headers: atlasHeaders({
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "text/event-stream",
      }),
      body: JSON.stringify({
        message: lastMessage,
        model,
        reasoning,
      }),
      signal: req.signal,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      const detail = safeErrorDetail(errorText, backendResponse.status);
      return new Response(JSON.stringify({ detail }), {
        status: backendResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!backendResponse.body) {
      return new Response(
        JSON.stringify({ detail: "Empty stream from backend" }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const backendBody = backendResponse.body;
    const abortSignal = req.signal;

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const reader = backendBody.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        let textId = "text-1";
        let reasoningId = "reasoning-1";
        let textSeq = 1;
        let reasoningSeq = 1;
        let textStarted = false;
        let reasoningStarted = false;
        let lastCodeToolCallId: string | null = null;

        const cancelReader = () => {
          void reader.cancel().catch(() => {});
        };

        if (abortSignal.aborted) {
          cancelReader();
          return;
        }
        abortSignal.addEventListener("abort", cancelReader);

        writer.write({ type: "start" });
        writer.write({ type: "start-step" });

        const endReasoning = () => {
          if (!reasoningStarted) return;
          writer.write({ type: "reasoning-end", id: reasoningId });
          reasoningStarted = false;
        };

        const endText = () => {
          if (!textStarted) return;
          writer.write({ type: "text-end", id: textId });
          textStarted = false;
        };

        const closeOpenParts = () => {
          endReasoning();
          endText();
        };

        try {
          while (true) {
            if (abortSignal.aborted) {
              cancelReader();
              break;
            }

            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split("\n\n");
            buffer = blocks.pop() ?? "";

            for (const block of blocks) {
              const parsed = parseSseBlock(block);
              if (!parsed) continue;

              let payload: Record<string, unknown>;
              try {
                payload = JSON.parse(parsed.data) as Record<string, unknown>;
              } catch {
                continue;
              }

              if (
                parsed.event === "session" &&
                typeof payload.session_id === "string"
              ) {
                writer.write({
                  type: "data-session",
                  data: { sessionId: payload.session_id },
                  transient: true,
                });
                continue;
              }

              if (parsed.event === "error") {
                const detail =
                  typeof payload.detail === "string"
                    ? payload.detail
                    : "Streaming error from backend";
                writer.write({ type: "error", errorText: detail });
                return;
              }

              if (parsed.event === "done") {
                if (typeof payload.session_id === "string") {
                  writer.write({
                    type: "data-session",
                    data: {
                      sessionId: payload.session_id,
                      tokensUsed: payload.tokens_used,
                      model: payload.model,
                      reasoning: payload.reasoning,
                    },
                    transient: true,
                  });
                }
                continue;
              }

              const type = payload.type;

              if (type === "reasoning" && typeof payload.token === "string") {
                endText();
                if (!reasoningStarted) {
                  reasoningSeq += 1;
                  reasoningId = `reasoning-${reasoningSeq}`;
                  writer.write({ type: "reasoning-start", id: reasoningId });
                  reasoningStarted = true;
                }
                writer.write({
                  type: "reasoning-delta",
                  id: reasoningId,
                  delta: payload.token,
                });
                continue;
              }

              if (type === "text" && typeof payload.token === "string") {
                endReasoning();
                if (!textStarted) {
                  textSeq += 1;
                  textId = `text-${textSeq}`;
                  writer.write({ type: "text-start", id: textId });
                  textStarted = true;
                }
                writer.write({
                  type: "text-delta",
                  id: textId,
                  delta: payload.token,
                });
                continue;
              }

              if (type === "tool_call") {
                closeOpenParts();

                const toolCallId =
                  typeof payload.tool_call_id === "string"
                    ? payload.tool_call_id
                    : `tool-${crypto.randomUUID()}`;
                const toolName =
                  typeof payload.tool_name === "string"
                    ? payload.tool_name
                    : "tool";
                const input =
                  payload.args && typeof payload.args === "object"
                    ? payload.args
                    : {};

                if (toolName === "code_execution") {
                  lastCodeToolCallId = toolCallId;
                }

                writer.write({
                  type: "tool-input-start",
                  toolCallId,
                  toolName,
                  dynamic: true,
                });
                writer.write({
                  type: "tool-input-available",
                  toolCallId,
                  toolName,
                  input,
                  dynamic: true,
                  providerExecuted: true,
                });
                continue;
              }

              if (type === "tool_result") {
                closeOpenParts();

                const toolName =
                  typeof payload.tool_name === "string"
                    ? payload.tool_name
                    : "tool";
                const toolCallId =
                  typeof payload.tool_call_id === "string"
                    ? payload.tool_call_id
                    : toolName === "code_execution" && lastCodeToolCallId
                      ? lastCodeToolCallId
                      : `tool-result-${crypto.randomUUID()}`;

                writer.write({
                  type: "tool-output-available",
                  toolCallId,
                  output: payload.output ?? {},
                  providerExecuted: true,
                });
                continue;
              }
            }
          }
        } finally {
          abortSignal.removeEventListener("abort", cancelReader);
          closeOpenParts();
          writer.write({ type: "finish-step" });
          writer.write({ type: "finish" });
        }
      },
      onError: () => "Streaming request failed",
    });

    return createUIMessageStreamResponse({ stream });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return new Response(null, { status: 499 });
    }
    return new Response(
      JSON.stringify({ detail: "Streaming request failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

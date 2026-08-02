import { Analytics } from "@/lib/analytics";
import type { UIMessageStreamWriter } from "ai";

export const MAX_MESSAGE_LENGTH = 32_000;

/** Error codes signaled by the backend chat endpoint (see services/chats.py). */
export const CHAT_ERROR_MODEL_NOT_FOUND = "MODEL_NOT_FOUND";
export const CHAT_ERROR_GENERATION_FAILED = "GENERATION_FAILED";

export interface BackendSseEvent {
  event: string;
  data: string;
}

/** AI SDK v5/v6 UI messages store text in `parts`, not top-level `content`. */
export function extractTextFromMessage(message: unknown): string {
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

/** Split a raw SSE block into its event name and JSON data payload. */
export function parseSseBlock(block: string): BackendSseEvent | null {
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

/** Parse the SSE `data:` line into a JSON object, or null if invalid. */
export function parseEventPayload(
  data: string,
): Record<string, unknown> | null {
  try {
    return JSON.parse(data) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface SafeUpstreamError {
  message: string;
  code?: string;
}

/** Map upstream error bodies to a short client-safe detail string. */
export function safeErrorDetail(
  body: string,
  status: number,
): SafeUpstreamError {
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    const isSafe = (s: unknown): s is string =>
      typeof s === "string" &&
      s.length > 0 &&
      s.length <= 500 &&
      !s.includes("Traceback") &&
      !s.includes("File ");

    if (isSafe(parsed.detail)) {
      return { message: parsed.detail };
    }
    if (parsed.detail && typeof parsed.detail === "object") {
      const d = parsed.detail as { code?: unknown; message?: unknown };
      if (isSafe(d.message)) {
        return {
          message: d.message,
          code: typeof d.code === "string" ? d.code : undefined,
        };
      }
    }
  } catch {
    // non-JSON body
  }

  return {
    message: safeStatusMessage(status),
    code: status === 403 ? "FORBIDDEN" : undefined,
  };
}

function safeStatusMessage(status: number): string {
  if (status === 401) return "Unauthorized";
  if (status === 403) return "Forbidden";
  if (status === 404) return "Not found";
  if (status === 422) return "Invalid request";
  if (status >= 500) return "Upstream service error";
  return "Request failed";
}

interface BackendStreamOptions {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  /** AI SDK UI message stream writer — receives the converted chunks. */
  writer: UIMessageStreamWriter;
  signal: AbortSignal;
  startedAt: number;
}

/**
 * Streams the backend's SSE body and converts it to AI SDK UI message chunks.
 * Handles text/reasoning/tool deltas and reports session/token completion.
 */
export async function pipeBackendStreamToUIMessage({
  reader,
  writer,
  signal,
  startedAt,
}: BackendStreamOptions): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";

  let textId = "text-1";
  let reasoningId = "reasoning-1";
  let textSeq = 1;
  let reasoningSeq = 1;
  let textStarted = false;
  let reasoningStarted = false;
  let lastCodeToolCallId: string | null = null;
  let lastSessionId: string | undefined;

  const cancelReader = () => {
    void reader.cancel().catch(() => {});
  };

  if (signal.aborted) {
    cancelReader();
    return;
  }
  signal.addEventListener("abort", cancelReader);

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

  const writeSession = (
    sessionId: string,
    extras?: Record<string, unknown>,
  ) => {
    writer.write({
      type: "data-session",
      data: { sessionId, ...extras },
      transient: true,
    });
  };

  const writeError = (code: string | undefined, detail: string) => {
    const context: Record<string, unknown> = {
      code: code ?? null,
      sessionId: lastSessionId ?? null,
      durationMs: Date.now() - startedAt,
    };

    if (code === CHAT_ERROR_MODEL_NOT_FOUND) {
      // The raw Gemini detail is API/setup noise ("update your code to use a
      // newer model") — log it adequately, don't surface it to the user.
      Analytics.captureLog(
        "chat.stream.error.model_not_found",
        {
          ...context,
          detail,
        },
        "warn",
      );
      writer.write({
        type: "error",
        errorText:
          "This model is no longer available. Please pick a different model and try again.",
      });
      return;
    }

    Analytics.captureError(new Error(`Chat stream error: ${detail}`), context);
    writer.write({ type: "error", errorText: detail });
  };

  const writeReasoningDelta = (token: string) => {
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
      delta: token,
    });
  };

  const writeTextDelta = (token: string) => {
    endReasoning();
    if (!textStarted) {
      textSeq += 1;
      textId = `text-${textSeq}`;
      writer.write({ type: "text-start", id: textId });
      textStarted = true;
    }
    writer.write({ type: "text-delta", id: textId, delta: token });
  };

  const writeToolCall = (payload: Record<string, unknown>) => {
    closeOpenParts();

    const toolCallId =
      typeof payload.tool_call_id === "string"
        ? payload.tool_call_id
        : `tool-${crypto.randomUUID()}`;
    const toolName =
      typeof payload.tool_name === "string" ? payload.tool_name : "tool";
    const input =
      payload.args && typeof payload.args === "object" ? payload.args : {};

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
  };

  const writeToolResult = (payload: Record<string, unknown>) => {
    closeOpenParts();

    const toolName =
      typeof payload.tool_name === "string" ? payload.tool_name : "tool";
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
  };

  try {
    while (true) {
      if (signal.aborted) {
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

        const payload = parseEventPayload(parsed.data);
        if (!payload) continue;

        if (parsed.event === "session") {
          if (typeof payload.session_id === "string") {
            lastSessionId = payload.session_id;
            writeSession(payload.session_id);
          }
          continue;
        }

        if (parsed.event === "error") {
          const detail =
            typeof payload.detail === "string"
              ? payload.detail
              : "Streaming error from backend";
          const code =
            typeof payload.code === "string" ? payload.code : undefined;
          writeError(code, detail);
          return;
        }

        if (parsed.event === "done") {
          if (typeof payload.session_id === "string") {
            Analytics.captureEvent("chat.stream.complete", {
              sessionId: payload.session_id,
              tokensUsed: payload.tokens_used,
              model: payload.model,
              reasoning: payload.reasoning,
              durationMs: Date.now() - startedAt,
            });
            writeSession(payload.session_id, {
              tokensUsed: payload.tokens_used,
              model: payload.model,
              reasoning: payload.reasoning,
            });
          }
          continue;
        }

        const type = payload.type;
        if (type === "reasoning" && typeof payload.token === "string") {
          writeReasoningDelta(payload.token);
        } else if (type === "text" && typeof payload.token === "string") {
          writeTextDelta(payload.token);
        } else if (type === "tool_call") {
          writeToolCall(payload);
        } else if (type === "tool_result") {
          writeToolResult(payload);
        }
      }
    }
  } finally {
    signal.removeEventListener("abort", cancelReader);
    closeOpenParts();
    writer.write({ type: "finish-step" });
    writer.write({ type: "finish" });
  }
}

"use client";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  CodeExecutionToolView,
  extractSearchData,
  isCodeTool,
  isSearchTool,
  SourceBubbles,
  type SourceItem,
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  WebSearchToolView,
} from "@/components/ai-elements/tool";
import { isToolUIPart, type UIMessage } from "ai";
import { AlertCircle, Check, Copy, FileTextIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { isPreviewableType } from "@/lib/attachments";
import { api } from "@/lib/axios";
import {
  AgentResponseBodySkeleton,
  AgentResponseSkeleton,
  AssistantHeader,
} from "./ChatSkeletons";

interface ChatMessageItemProps {
  message: UIMessage;
  isStreaming?: boolean;
}

function getLegacyContent(message: UIMessage): string {
  const raw = (message as unknown as Record<string, unknown>).content;
  return typeof raw === "string" ? raw : "";
}

/** True once any visible assistant content has arrived (text, thoughts, or tools). */
export function messageHasVisibleContent(message: UIMessage): boolean {
  if (getLegacyContent(message).trim().length > 0) {
    return true;
  }
  return (message.parts ?? []).some((part) => {
    if (part.type === "text" && part.text.trim().length > 0) return true;
    if (part.type === "reasoning" && part.text.trim().length > 0) return true;
    if (part.type === "file") return true;
    if (isToolUIPart(part)) return true;
    return false;
  });
}

function getMessagePlainText(message: UIMessage): string {
  const legacy = getLegacyContent(message).trim();
  if (legacy) return legacy;

  return (message.parts ?? [])
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => (part as { text: string }).text)
    .join("\n")
    .trim();
}

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked
    }
  }, [text]);

  if (!text) return null;

  return (
    <MessageActions className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
      <MessageAction
        tooltip={copied ? "Copied" : "Copy"}
        label={copied ? "Copied" : "Copy message"}
        onClick={handleCopy}
        className="text-gray-medium hover:text-on-surface h-8 w-8"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </MessageAction>
    </MessageActions>
  );
}

function AttachmentPart({
  part,
}: {
  part: {
    mediaType?: string;
    filename?: string;
    url?: string;
    downloadUrl?: string;
    download_url?: string;
    urlExpiresAt?: string;
    attachmentId?: string;
    attachment_id?: string;
  };
}) {
  const { mediaType, filename, url } = part;
  const downloadUrl = part.downloadUrl || (part as any).download_url;
  const attachmentId = part.attachmentId || (part as any).attachment_id;
  const name = filename || "Attachment";
  const previewable =
    Boolean(url || attachmentId) && isPreviewableType(mediaType || "");
  if (previewable) {
    return (
      <div className="relative">
        <OptimizedImage
          src={url || ""}
          attachmentId={attachmentId}
          urlExpiresAt={part.urlExpiresAt}
          alt={name}
          sizeBytes={(part as any).size}
          className="max-h-48"
          onImageClick={(currentUrl) => {
            if (currentUrl) {
              window.open(currentUrl, "_blank", "noopener,noreferrer");
            }
          }}
        />
      </div>
    );
  }

  const handleDownloadFile = async (e: React.MouseEvent) => {
    if (downloadUrl) {
      // Direct download via signed URL with Content-Disposition: attachment
      return;
    }
    if (attachmentId) {
      e.preventDefault();
      try {
        const response = await api.get(
          `/agent/attachments/${attachmentId}/content`,
          { responseType: "blob" },
        );
        const blobUrl = window.URL.createObjectURL(response.data);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      } catch {
        if (url) window.open(url, "_blank");
      }
    }
  };

  const content = (
    <span className="bg-surface-container-low text-on-surface hover:bg-surface-container mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-[rgba(0,0,0,0.06)] px-2.5 py-1.5 transition-colors">
      <FileTextIcon className="text-gray-medium h-4 w-4 shrink-0" />
      <span className="font-label-md truncate text-xs">{name}</span>
    </span>
  );

  return (
    <div className="relative inline-block">
      {url || downloadUrl ? (
        <a
          href={downloadUrl || url}
          download={name}
          onClick={handleDownloadFile}
          className="block"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

function MessageParts({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming?: boolean;
}) {
  const allSources = useMemo(() => {
    const rawParts = message.parts ?? [];
    const collected: SourceItem[] = [];
    const seenUrls = new Set<string>();
    for (const part of rawParts) {
      if (
        (part as any).type === "sources" &&
        Array.isArray((part as any).sources)
      ) {
        for (const s of (part as any).sources) {
          const url = s.url || s.uri || "";
          if (!url || seenUrls.has(url)) continue;
          seenUrls.add(url);

          let domain = s.domain || "";
          try {
            const parsed = new URL(url);
            if (
              !parsed.hostname.includes("grounding-api-redirect") &&
              !parsed.hostname.includes("vertexaisearch")
            ) {
              domain = parsed.hostname.replace(/^www\./, "");
            }
          } catch {
            // ignore
          }
          if (
            !domain &&
            s.title &&
            s.title.includes(".") &&
            !s.title.includes(" ")
          ) {
            domain = s.title.replace(/^https?:\/\//, "").replace(/^www\./, "");
          }
          const title = s.title || domain || "Web Source";
          const finalDomain = domain || title;
          const faviconHost =
            domain || (title.includes(".") ? title : "google.com");
          const faviconUrl =
            s.faviconUrl ||
            `https://www.google.com/s2/favicons?domain=${encodeURIComponent(faviconHost)}&sz=32`;

          collected.push({
            title,
            url,
            domain: finalDomain,
            faviconUrl,
          });
        }
      } else if (isToolUIPart(part)) {
        const isDynamic = part.type === "dynamic-tool";
        const toolName = isDynamic
          ? part.toolName
          : part.type.slice("tool-".length);
        if (isSearchTool(toolName)) {
          const { sources } = extractSearchData(part);
          for (const s of sources) {
            if (!seenUrls.has(s.url)) {
              seenUrls.add(s.url);
              collected.push(s);
            }
          }
        }
      }
    }
    return collected;
  }, [message.parts]);

  const parts = message.parts ? [...message.parts] : [];

  // Extract optimistic attachments sent by useChat (ai SDK)
  const experimentalAttachments =
    (message as any).experimental_attachments ?? [];
  for (const att of experimentalAttachments) {
    parts.push({
      type: "file",
      mediaType: att.contentType,
      url: att.url,
      filename: att.name,
      size: (att as any).size,
    } as any);
  }

  const legacyContent = getLegacyContent(message);

  // Fallback for legacy plain text messages
  if (parts.length === 0 && legacyContent.trim()) {
    return <MessageResponse>{legacyContent}</MessageResponse>;
  }

  const msgObj = message as unknown as Record<string, unknown>;
  const isGenerating = Boolean(isStreaming) || Boolean(msgObj.isGenerating);
  const waitingForFirstToken =
    isGenerating && !messageHasVisibleContent(message);

  if (waitingForFirstToken || parts.length === 0) {
    if (isGenerating) {
      return <AgentResponseBodySkeleton />;
    }
    return null;
  }

  return (
    <>
      {parts.map((part, index) => {
        const key = `${message.id}-${part.type}-${index}`;

        if (part.type === "text") {
          // Skip empty text shells that AI SDK may open before content arrives
          if (!part.text.trim() && isGenerating) {
            return null;
          }
          const animating =
            Boolean(isStreaming) &&
            (part.state === "streaming" || index === parts.length - 1);
          return (
            <MessageResponse key={key} isAnimating={animating}>
              {part.text}
            </MessageResponse>
          );
        }

        if (part.type === "reasoning") {
          if (!part.text.trim() && isGenerating) {
            return null;
          }
          const reasoningStreaming =
            part.state === "streaming" ||
            (Boolean(isStreaming) && index === parts.length - 1);
          return (
            <Reasoning
              key={key}
              className="w-full"
              isStreaming={reasoningStreaming}
              defaultOpen={reasoningStreaming}
            >
              <ReasoningTrigger />
              <ReasoningContent>{part.text}</ReasoningContent>
            </Reasoning>
          );
        }

        if (part.type === "file") {
          return <AttachmentPart key={key} part={part} />;
        }

        if (isToolUIPart(part)) {
          const isDynamic = part.type === "dynamic-tool";
          const toolName = isDynamic
            ? part.toolName
            : part.type.slice("tool-".length);

          if (isSearchTool(toolName)) {
            return (
              <WebSearchToolView key={part.toolCallId || key} part={part} />
            );
          }

          if (isCodeTool(toolName)) {
            return (
              <CodeExecutionToolView key={part.toolCallId || key} part={part} />
            );
          }

          const openByDefault =
            part.state === "input-streaming" ||
            part.state === "input-available" ||
            part.state === "output-error";

          return (
            <Tool key={part.toolCallId || key} defaultOpen={openByDefault}>
              {isDynamic ? (
                <ToolHeader
                  type="dynamic-tool"
                  state={part.state}
                  toolName={toolName}
                />
              ) : (
                <ToolHeader type={part.type} state={part.state} />
              )}
              <ToolContent>
                {"input" in part && part.input ? (
                  <ToolInput input={part.input} />
                ) : null}
                <ToolOutput
                  output={"output" in part ? part.output : undefined}
                  errorText={"errorText" in part ? part.errorText : undefined}
                />
              </ToolContent>
            </Tool>
          );
        }

        return null;
      })}
      {allSources.length > 0 && !isGenerating ? (
        <SourceBubbles sources={allSources} />
      ) : null}
      {isGenerating ? (
        <div className="text-muted-foreground/80 animate-in fade-in mt-2.5 flex items-center gap-2 py-0.5 text-xs duration-300">
          <span className="relative flex h-2 w-2">
            <span className="bg-primary/60 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
          </span>
          <span className="font-mono text-[11px] font-medium tracking-wide">
            Generating...
          </span>
        </div>
      ) : null}
    </>
  );
}

/** Placeholder assistant row when stream is open but no assistant message exists yet. */
export function AssistantMessageSkeleton() {
  return <AgentResponseSkeleton />;
}

export function ChatMessageItem({
  message,
  isStreaming,
}: ChatMessageItemProps) {
  const from = message.role === "user" ? "user" : "assistant";
  const plainText = getMessagePlainText(message);
  const showCopy = Boolean(plainText) && !isStreaming;

  if (from === "user") {
    const msgObj = message as unknown as Record<string, unknown>;
    const rawError =
      typeof msgObj.error === "string"
        ? msgObj.error
        : (msgObj.error as Error)?.message;

    // Suppress FE-triggered abort/cancel/network errors (e.g. page reload
    // during an active stream). Only show genuine backend errors.
    const isAbortLike =
      rawError &&
      (/abort|cancel|network/i.test(rawError) ||
        (msgObj.error instanceof DOMException &&
          (msgObj.error as DOMException).name === "AbortError"));
    const errorDetail = isAbortLike ? undefined : rawError;

    const userText = getMessagePlainText(message);
    const userFiles = (message.parts ?? []).filter((p) => p.type === "file");
    const experimentalAttachments =
      (message as any).experimental_attachments ?? [];

    return (
      <div className="flex w-full flex-col items-end">
        <Message from="user" className="items-end">
          <MessageContent>
            {userFiles.map((part, idx) => (
              <AttachmentPart key={`file-${idx}`} part={part as any} />
            ))}
            {experimentalAttachments.map((att: any, idx: number) => (
              <AttachmentPart
                key={`exp-file-${idx}`}
                part={
                  {
                    type: "file",
                    mediaType: att.contentType,
                    url: att.url,
                    filename: att.name,
                    size: att.size,
                  } as any
                }
              />
            ))}
            {userText ? (
              <div className="break-words whitespace-pre-wrap">{userText}</div>
            ) : null}
          </MessageContent>
          {showCopy ? <CopyMessageButton text={plainText} /> : null}
        </Message>
        {errorDetail ? (
          <div className="my-2 w-full max-w-full space-y-1 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left">
            <div className="flex items-center gap-2 text-sm font-medium text-red-900 dark:text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>There was a problem responding to your message.</span>
            </div>
            <p className="pl-6 font-mono text-xs text-red-700/80 dark:text-red-300/70">
              {errorDetail}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  const msgObj = message as unknown as Record<string, unknown>;
  const isGenerating = Boolean(isStreaming) || Boolean(msgObj.isGenerating);
  const hasExplicitError = Boolean(msgObj.error);
  const errorDetail =
    typeof msgObj.error === "string"
      ? msgObj.error
      : (msgObj.error as Error)?.message ||
        "Model generation failed. Please try again.";

  const isCancelled =
    errorDetail.toLowerCase().includes("abort") ||
    errorDetail.toLowerCase().includes("cancel");

  // A message has failed ONLY if it has an explicit error, is not generating, and is not cancelled/aborted
  const hasFailed = !isGenerating && hasExplicitError && !isCancelled;

  const waitingForFirstToken =
    isGenerating && !messageHasVisibleContent(message);
  const resolvedModel = (msgObj.model as string) || undefined;
  const resolvedReasoning = (msgObj.reasoning as string) || undefined;

  return (
    <Message from="assistant" className="max-w-full">
      <AssistantHeader
        isWaiting={isGenerating}
        model={resolvedModel}
        reasoning={resolvedReasoning}
      />
      <MessageContent className="w-full max-w-full">
        {hasFailed ? (
          <div className="my-2 space-y-1 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left">
            <div className="flex items-center gap-2 text-sm font-medium text-red-900 dark:text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>There was a problem responding to your message.</span>
            </div>
            <p className="pl-6 font-mono text-xs text-red-700/80 dark:text-red-300/70">
              {errorDetail}
            </p>
          </div>
        ) : (
          <MessageParts message={message} isStreaming={isGenerating} />
        )}
      </MessageContent>
      {showCopy && !hasFailed ? <CopyMessageButton text={plainText} /> : null}
    </Message>
  );
}

"use client";

import { FileTextIcon, XIcon } from "lucide-react";
import {
  usePromptInputAttachments,
  PromptInputHeader,
} from "@/components/ai-elements/prompt-input";
import { isPreviewableType } from "@/lib/attachments";
import { cn } from "@/lib/utils";

/**
 * Renders the currently attached files as removable chips inside the prompt
 * input. Images show an inline thumbnail; other files show a file icon.
 */
export function AttachmentChips({ className }: { className?: string }) {
  const { files, remove } = usePromptInputAttachments();

  if (files.length === 0) return null;

  return (
    <PromptInputHeader className={cn("pt-2", className)}>
      {files.map((file) => {
        const previewable = isPreviewableType(file.mediaType);

        return (
          <div
            key={file.id}
            className="animate-in fade-in zoom-in-95 bg-surface-container-low flex max-w-[220px] items-center gap-2 rounded-lg border border-[rgba(0,0,0,0.06)] py-1 pr-1 pl-1 duration-200"
          >
            {previewable ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.url}
                alt={file.filename ?? "Attachment"}
                className="h-8 w-8 shrink-0 rounded-md object-cover"
              />
            ) : (
              <span className="bg-surface-container-high text-gray-medium flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                <FileTextIcon className="h-4 w-4" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="font-label-md text-on-surface block max-w-full truncate text-xs">
                {file.filename ?? "Attachment"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => remove(file.id)}
              className="text-gray-medium hover:text-on-surface shrink-0 rounded-full p-1 transition-colors"
              aria-label={`Remove ${file.filename ?? "attachment"}`}
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </PromptInputHeader>
  );
}

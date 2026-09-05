"use client";

import { FileTextIcon, XIcon } from "lucide-react";
import {
  usePromptInputAttachments,
  PromptInputHeader,
} from "@/components/ai-elements/prompt-input";
import { isPreviewableType } from "@/lib/attachments";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";

function DonutProgress({ progress }: { progress: number }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 backdrop-blur-[1px]">
      <svg className="h-6 w-6 -rotate-90 transform" viewBox="0 0 24 24">
        <circle
          className="text-white/30"
          strokeWidth="2.5"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="12"
          cy="12"
        />
        <circle
          className="text-white transition-all duration-300 ease-out"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="12"
          cy="12"
        />
      </svg>
    </div>
  );
}

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
        const isUploading = !file.uploadedId && !file.error;

        return (
          <div
            key={file.id}
            className={cn(
              "animate-in fade-in zoom-in-95 bg-surface-container-low flex max-w-[220px] items-center gap-2 rounded-lg border border-[rgba(0,0,0,0.06)] py-1 pr-1 pl-1 duration-200",
              file.error && "border-red-500/50 bg-red-50",
            )}
          >
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md">
              {previewable ? (
                <OptimizedImage
                  src={file.url}
                  alt={file.filename ?? "Attachment"}
                  fill
                  containerClassName="h-full w-full rounded-md border-none"
                  className="rounded-md object-cover"
                />
              ) : (
                <span className="bg-surface-container-high text-gray-medium flex h-full w-full items-center justify-center rounded-md">
                  <FileTextIcon className="h-4 w-4" />
                </span>
              )}
              {isUploading && <DonutProgress progress={file.progress || 0} />}
            </div>

            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "font-label-md block max-w-full truncate text-xs",
                  file.error ? "text-red-600" : "text-on-surface",
                )}
              >
                {file.filename ?? "Attachment"}
              </span>
              {file.error && (
                <span className="font-label-sm block truncate text-[10px] text-red-500">
                  Upload failed
                </span>
              )}
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

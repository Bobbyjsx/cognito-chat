import type { AttachmentSchema, AttachmentType } from "@/types";

/**
 * Shared attachment helpers (upload preparation, config mapping, formatting).
 * Kept dependency-free so both UI components and hooks can use it.
 */

/** HTML `accept` pattern per backend attachment type. */
const ACCEPT_BY_TYPE: Record<AttachmentType, string> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  pdf: ".pdf,application/pdf",
  document:
    ".docx,.doc,.txt,.md,.csv,.rtf,text/*,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword",
  spreadsheet:
    ".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
  json: ".json,application/json",
  text: "text/*",
};

/** Build the file-input `accept` attribute from the allowed types list. */
export function acceptFromAllowedTypes(
  allowedTypes?: AttachmentType[],
): string | undefined {
  if (!allowedTypes || allowedTypes.length === 0) return undefined;
  return [...new Set(allowedTypes.map((t) => ACCEPT_BY_TYPE[t] ?? ""))]
    .filter(Boolean)
    .join(",");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** True for attachment types that render as inline image previews. */
export function isPreviewableType(mediaType: string): boolean {
  return mediaType.startsWith("image/");
}

/** Resolve an attachment id to its metadata, tolerating unknown ids. */
export function attachmentById(
  attachments: AttachmentSchema[] | undefined,
  id: string,
): AttachmentSchema | undefined {
  return attachments?.find((a) => a.id === id);
}

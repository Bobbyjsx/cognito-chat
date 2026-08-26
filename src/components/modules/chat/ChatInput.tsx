"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputTextarea,
  PromptInputButton,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import { acceptFromAllowedTypes } from "@/lib/attachments";
import type { FileUIPart } from "ai";
import type { ChatStatus } from "ai";
import { AttachmentChips } from "./AttachmentChips";
import { DictationToolbar } from "./DictationToolbar";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import { LibraryGalleryModal } from "../library/LibraryGalleryModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Monitor, Image as ImageIcon, Plus } from "lucide-react";

interface ChatInputProps {
  onSend: (
    text: string,
    model?: string,
    reasoning?: string,
    attachmentIds?: string[],
    files?: FileUIPart[],
    attachmentMeta?: Record<string, { mimeType: string; filename: string }>,
  ) => void;
  onStop?: () => void;
  status: ChatStatus;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  selectedReasoning: string;
  onSelectReasoning: (reasoning: string) => void;
}

function AttachFilesButton({ disabled }: { disabled?: boolean }) {
  const { openFileDialog, addExisting } = usePromptInputAttachments();
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <PromptInputButton
              type="button"
              variant="ghost"
              className="text-gray-medium hover:bg-surface-container-low hover:text-on-surface rounded-full transition-all duration-200"
              tooltip="Attach files"
              disabled={disabled}
              aria-label="Attach files"
            />
          }
        >
          <Plus className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-auto min-w-[200px]">
          <DropdownMenuItem
            onClick={openFileDialog}
            className="whitespace-nowrap"
          >
            <Monitor className="mr-2 h-4 w-4 shrink-0" />
            Upload from Device
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLibraryOpen(true)}
            className="whitespace-nowrap"
          >
            <ImageIcon className="mr-2 h-4 w-4 shrink-0" />
            Choose from Library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LibraryGalleryModal
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(att) => {
          addExisting([att]);
        }}
      />
    </>
  );
}

export function ChatInput({
  onSend,
  onStop,
  status,
  selectedModel,
  onSelectModel,
  selectedReasoning,
  onSelectReasoning,
}: ChatInputProps) {
  const { data: config, isLoading: isConfigLoading } = useGetConfig();
  const { isLoading: isProfileLoading } = useProfile();
  const [lastSentText, setLastSentText] = useState("");

  const isBusy = status === "submitted" || status === "streaming";
  const canStop = isBusy && Boolean(onStop);
  const attachmentsEnabled = config?.enableAttachments ?? true;
  const accept = acceptFromAllowedTypes(config?.attachmentAllowedTypes);
  const maxFiles = config?.attachmentMaxCount ?? 10;
  const maxFileSize = config?.attachmentMaxSize ?? 20_000_000;

  if (isConfigLoading || isProfileLoading) {
    return (
      <div className="bg-background/80 shrink-0 border-t border-[rgba(0,0,0,0.06)] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-4 sm:pt-4 md:p-6 md:pb-6">
        <div className="relative mx-auto w-full max-w-[800px]">
          <div className="ambient-shadow flex w-full flex-col overflow-hidden rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-3">
            <div className="bg-muted h-14 w-full animate-pulse rounded-md" />
            <div className="mt-3 flex items-center justify-between">
              <div className="bg-muted h-8 w-10 animate-pulse rounded-md" />
              <div className="bg-muted h-8 w-[240px] animate-pulse rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || isBusy) return;

    if (message.files.length > 0) {
      if (!attachmentsEnabled) {
        toast.error("Attachments are currently disabled by admin.");
        return;
      }
      if (message.files.some((f) => !f.uploadedId && !f.error)) {
        toast.error("Please wait for attachments to finish uploading.");
        return;
      }
      if (message.files.some((f) => f.error)) {
        toast.error(
          "Some attachments failed to upload. Please remove them to continue.",
        );
        return;
      }
    }

    const attachmentIds = message.files
      .map((f) => f.uploadedId)
      .filter(Boolean) as string[];

    const attachmentMeta: Record<
      string,
      { mimeType: string; filename: string }
    > = {};
    message.files.forEach((f) => {
      if (f.uploadedId) {
        attachmentMeta[f.uploadedId] = {
          mimeType: f.mediaType || "application/octet-stream",
          filename: f.filename || `Attachment ${f.uploadedId}`,
        };
      }
    });

    const unuploadedFiles = message.files.filter((f) => !f.uploadedId);

    setLastSentText(message.text);

    onSend(
      text,
      selectedModel,
      selectedReasoning,
      attachmentIds,
      unuploadedFiles,
      attachmentMeta,
    );
  };

  return (
    <div className="bg-background/80 shrink-0 border-t border-[rgba(0,0,0,0.06)] px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-4 sm:pt-3.5 sm:pb-4 md:p-6 md:pb-6">
      <div className="relative mx-auto w-full max-w-[800px]">
        <PromptInputProvider>
          <PromptInput
            onSubmit={handleSubmit}
            className="ambient-shadow bg-surface-container-low w-full overflow-hidden rounded-[24px] border border-[rgba(0,0,0,0.06)] transition-all duration-200 focus-within:border-[rgba(0,0,0,0.15)] focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
            accept={attachmentsEnabled ? accept : undefined}
            multiple
            maxFiles={maxFiles}
            maxFileSize={maxFileSize}
            onError={(err) => toast.error(err.message)}
          >
            <PromptInputBody>
              <AttachmentChips />
              <PromptInputTextarea
                placeholder="Ask anything"
                disabled={isBusy}
                className="font-body-md text-on-surface placeholder:text-gray-medium max-h-[40dvh] min-h-[52px] px-3 py-2.5 focus:outline-none sm:min-h-[64px] sm:px-4 sm:py-3"
              />
            </PromptInputBody>
            <PromptInputFooter className="bg-surface-container-low flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(0,0,0,0.04)] px-2 pt-1.5 pb-2 sm:px-3 sm:pb-2.5">
              {attachmentsEnabled && <AttachFilesButton disabled={isBusy} />}
              <DictationToolbar
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                selectedReasoning={selectedReasoning}
                onSelectReasoning={onSelectReasoning}
                status={status}
                onStop={onStop}
                isBusy={isBusy}
                canStop={canStop}
                isUploading={false}
                lastSentText={lastSentText}
              />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </div>
  );
}

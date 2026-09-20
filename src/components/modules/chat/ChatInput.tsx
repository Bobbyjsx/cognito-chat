"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { toast } from "@/components/ui/toast";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputButton,
  usePromptInputAttachments,
  usePromptInputController,
  PromptInputTools,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import { acceptFromAllowedTypes } from "@/lib/attachments";
import type { FileUIPart } from "ai";
import type { ChatStatus } from "ai";
import { AttachmentChips } from "./AttachmentChips";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import { getQuotaSnapshot, formatPreciseCountdown } from "@/lib/quota";
import type { UserProfile } from "@/types";
import { LibraryGalleryModal } from "../library/LibraryGalleryModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Monitor,
  Image as ImageIcon,
  Plus,
  Mic,
  Loader2,
  X,
  Check,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaywallDialog } from "@/components/modules/billing/PaywallDialog";
import { isPaidTier, normalizeTier } from "@/lib/plans";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  useSpeechToText,
  isSpeechRecognitionSupported,
  type SttMode,
} from "@/hooks/stt/useSpeechToText";
import { AudioVisualizer } from "./AudioVisualizer";
import { ModelSelector } from "./ModelSelector";
import { ChatMentionPopover } from "./ChatMentionPopover";
import {
  extractActiveMention,
  type PromptItem,
  type PromptCategory,
} from "@/lib/prompt-library";
import { usePrompts } from "@/hooks/data/usePrompts";
import { useDebounce } from "@/hooks/useDebounce";
import {
  InlinePromptEditor,
  type EditorTextRange,
  type InlinePromptEditorHandle,
} from "./InlinePromptEditor";

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
  /** Raw prompt tag string (e.g. [prompt:id|title|b64]) to pre-fill on mount */
  initialPromptTag?: string;
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

// Inner form component that consumes the controller and renders dictation state
function ChatInputForm({
  selectedModel,
  onSelectModel,
  selectedReasoning,
  onSelectReasoning,
  status,
  onStop,
  isBusy,
  canStop,
  attachmentsEnabled,
  lastSentText,
  config,
  isPremium,
  onUpgradeClick,
}: {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  selectedReasoning: string;
  onSelectReasoning: (reasoning: string) => void;
  status: ChatStatus;
  onStop?: () => void;
  isBusy: boolean;
  canStop: boolean;
  attachmentsEnabled: boolean;
  lastSentText: string;
  config: any;
  isPremium: boolean;
  onUpgradeClick: () => void;
}) {
  const aiSttEnabled = config?.enableAiStt ?? false;
  const sttMode: SttMode = aiSttEnabled ? "ai" : "browser";
  const showMic = aiSttEnabled || isSpeechRecognitionSupported;

  const {
    isListening,
    isTranscribing,
    transcript,
    mediaRecorder,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText(sttMode);

  const controller = usePromptInputController();
  const initialTextRef = useRef("");
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<InlinePromptEditorHandle>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionRange, setMentionRange] = useState<EditorTextRange | null>(
    null,
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<PromptCategory>("all");

  const debouncedQuery = useDebounce(mentionQuery, 300);
  const { data: filteredPrompts = [], isLoading: isLoadingPrompts } =
    usePrompts(debouncedQuery, activeCategory, { enabled: isPremium });

  const handleToggle = () => {
    if (isListening || isTranscribing) {
      void stopListening(true);
    } else {
      initialTextRef.current = controller.textInput.value;
      resetTranscript();
      void startListening();
    }
  };

  const handleCancel = () => {
    void (async () => {
      await stopListening(true);
      controller.textInput.setInput(initialTextRef.current);
      resetTranscript();
    })();
  };

  const handleDone = () => {
    void (async () => {
      const finalTranscript = await stopListening(false);
      const text = sttMode === "ai" ? (finalTranscript ?? "") : transcript;
      const spacer = initialTextRef.current && text ? " " : "";
      controller.textInput.setInput(initialTextRef.current + spacer + text);
    })();
  };

  // Sync live transcript into the prompt input while speaking
  useEffect(() => {
    if (isListening && sttMode === "browser") {
      const spacer = initialTextRef.current && transcript ? " " : "";
      controller.textInput.setInput(
        initialTextRef.current + spacer + transcript,
      );
    }
  }, [transcript, isListening, sttMode, controller.textInput]);

  const isUploadingAttachments = controller.attachments.files.some(
    (f) => !f.uploadedId && !f.error,
  );

  const handleSelectPrompt = useCallback(
    (prompt: PromptItem) => {
      if (!isPremium) {
        onUpgradeClick();
        return;
      }
      setMentionOpen(false);
      if (mentionRange) editorRef.current?.insertPrompt(prompt, mentionRange);
      setMentionRange(null);
    },
    [isPremium, onUpgradeClick, mentionRange],
  );

  const handleAttachClick = useCallback(() => {
    setMentionOpen(false);
    if (mentionRange) editorRef.current?.replaceRange(mentionRange);
    setMentionRange(null);
    controller.attachments.openFileDialog();
  }, [controller.attachments, mentionRange]);

  const updateMention = useCallback(
    (val: string, cursorPos: number) => {
      const mention = extractActiveMention(val, cursorPos);

      if (mention) {
        if (mention.query !== mentionQuery) setSelectedIndex(0);
        setMentionQuery(mention.query);
        setMentionRange({ start: mention.startIndex, end: mention.endIndex });
        setMentionOpen(true);
      } else if (mentionOpen) {
        setMentionOpen(false);
        setMentionRange(null);
      }
    },
    [mentionOpen, mentionQuery],
  );

  useEffect(() => {
    const el = inputContainerRef.current?.closest("form");
    if (!el) return;
    const handleClick = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest(
          'button, a, input, select, textarea, [role="button"], [role="menuitem"], [data-remove-prompt]',
        )
      ) {
        editorRef.current?.focus();
      }
    };
    el.addEventListener("click", handleClick);
    return () => el.removeEventListener("click", handleClick);
  }, []);

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (mentionOpen) {
      const hasTools = mentionQuery === "";
      const toolsCount = hasTools && attachmentsEnabled ? 1 : 0;
      const totalItems = toolsCount + filteredPrompts.length;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (totalItems > 0) {
          setSelectedIndex((prev) => (prev + 1) % totalItems);
        }
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (totalItems > 0) {
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        }
        return;
      }
      if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey) {
        if (totalItems > 0) {
          e.preventDefault();
          if (hasTools && selectedIndex < toolsCount) {
            handleAttachClick();
          } else {
            const promptIdx = hasTools
              ? selectedIndex - toolsCount
              : selectedIndex;
            const chosen = filteredPrompts[promptIdx];
            if (chosen) {
              handleSelectPrompt(chosen);
            }
          }
          return;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }

    if (
      e.key === "Backspace" &&
      controller.textInput.value === "" &&
      controller.attachments.files.length > 0
    ) {
      e.preventDefault();
      const lastAttachment = controller.attachments.files.at(-1);
      if (lastAttachment) controller.attachments.remove(lastAttachment.id);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const submitButton = e.currentTarget
        .closest("form")
        ?.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (!submitButton?.disabled) submitButton?.form?.requestSubmit();
    }
  };

  return (
    <>
      <PromptInputBody>
        <AttachmentChips />
        <div
          ref={inputContainerRef}
          className="relative flex min-h-[44px] w-full flex-1 flex-wrap items-center gap-2 px-3 py-2 sm:min-h-[52px] sm:px-4 sm:py-2.5"
        >
          {isListening || isTranscribing ? (
            <div className="animate-in fade-in zoom-in-95 flex min-h-[28px] w-full min-w-0 items-center gap-2 duration-200">
              {isTranscribing ? (
                <div className="text-gray-medium flex min-w-0 flex-1 items-center justify-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  <span className="truncate">Transcribing…</span>
                </div>
              ) : (
                <AudioVisualizer
                  mediaRecorder={mediaRecorder}
                  className="min-w-0 flex-1"
                />
              )}
            </div>
          ) : (
            <InlinePromptEditor
              ref={editorRef}
              value={controller.textInput.value}
              placeholder="Ask anything (type @ for tools & prompts)"
              disabled={isBusy}
              onValueChange={(nextValue, cursor) => {
                controller.textInput.setInput(nextValue);
                updateMention(nextValue, cursor);
              }}
              onCaretChange={updateMention}
              onKeyDown={handleEditorKeyDown}
              onPasteFiles={(files) => controller.attachments.add(files)}
              className="max-h-[40dvh] overflow-y-auto"
            />
          )}
        </div>

        <ChatMentionPopover
          open={mentionOpen}
          onOpenChange={setMentionOpen}
          query={mentionQuery}
          prompts={filteredPrompts}
          isLoading={isLoadingPrompts}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onSelectPrompt={handleSelectPrompt}
          onAttachClick={attachmentsEnabled ? handleAttachClick : undefined}
          onUpgradeClick={onUpgradeClick}
          isPremium={isPremium}
          anchorRef={inputContainerRef}
        />
      </PromptInputBody>

      <PromptInputFooter className="bg-surface-container-low flex w-full cursor-text flex-wrap items-center justify-between gap-2 px-2 pt-1.5 pb-2 sm:px-3 sm:pb-2.5">
        <div className="flex shrink-0 items-center">
          {attachmentsEnabled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div>
                      <AttachFilesButton
                        disabled={isBusy || isListening || isTranscribing}
                      />
                    </div>
                  }
                />
                {(isListening || isTranscribing) && (
                  <TooltipContent side="top" className="text-xs">
                    Attachment is not supported while dictating
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {!(isListening || isTranscribing) && (
          <PromptInputTools className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <ModelSelector
              selectedModel={selectedModel}
              onSelectModel={onSelectModel}
              selectedReasoning={selectedReasoning}
              onSelectReasoning={onSelectReasoning}
            />
          </PromptInputTools>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {isListening || isTranscribing ? (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCancel}
                        disabled={isTranscribing}
                        className="shrink-0 rounded-full border-red-200 text-red-500 hover:bg-red-50 sm:size-auto sm:px-3 sm:py-1.5 dark:border-red-900/30 dark:hover:bg-red-900/20"
                        aria-label="Cancel dictation"
                      />
                    }
                  >
                    <X className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Cancel
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleDone}
                        disabled={isTranscribing}
                        className="bg-primary text-on-primary shrink-0 rounded-full hover:bg-[#3d3f42] active:scale-[0.96] sm:size-auto sm:px-3 sm:py-1.5"
                        aria-label="Finish dictation and keep transcript"
                      />
                    }
                  >
                    <Check className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Done
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <>
              {showMic && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleToggle}
                          className="text-gray-medium hover:bg-surface-container-low hover:text-on-surface rounded-full transition-all duration-200"
                          aria-label="Dictate prompt"
                        />
                      }
                    >
                      <Mic className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Dictate Prompt
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <PromptInputSubmit
                status={status}
                onStop={() => {
                  onStop?.();
                  if (lastSentText) {
                    controller.textInput.setInput(lastSentText);
                  }
                }}
                disabled={(isBusy && !canStop) || isUploadingAttachments}
                className="bg-primary text-on-primary rounded-lg transition-all duration-200 hover:bg-[#3d3f42] active:scale-[0.96]"
              />
            </>
          )}
        </div>
      </PromptInputFooter>
    </>
  );
}

function QuotaLimitBanner({
  profile,
  onRefresh,
}: {
  profile: UserProfile | undefined;
  onRefresh: () => void;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [paywallOpen, setPaywallOpen] = useState(false);
  const tier = normalizeTier(profile?.tier);
  const canUpgrade = tier !== "premium";

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const q = getQuotaSnapshot(profile, nowMs);
  const is6hExceeded = q.pct6h >= 100;

  const raw = profile as unknown as Record<string, unknown> | undefined;
  const targetIso = is6hExceeded
    ? profile?.resetAt || (raw?.reset_at as string | undefined)
    : profile?.weeklyResetAt || (raw?.weekly_reset_at as string | undefined);

  const { formatted: countdownText, isExpired } = formatPreciseCountdown(
    targetIso,
    nowMs,
  );

  useEffect(() => {
    if (isExpired && targetIso) {
      onRefresh();
    }
  }, [isExpired, targetIso, onRefresh]);

  return (
    <div className="ambient-shadow bg-surface-container-low/95 relative w-full overflow-hidden rounded-[24px] border border-[rgba(0,0,0,0.06)] p-3.5 shadow-sm backdrop-blur-md sm:px-5 sm:py-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 sm:h-9 sm:w-9 sm:rounded-2xl dark:bg-amber-400/10 dark:text-amber-400">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-on-surface text-sm font-semibold tracking-tight">
              Usage limit reached
            </h4>
            <p className="text-gray-medium text-xs leading-relaxed sm:text-[13px]">
              {canUpgrade
                ? "Messaging is paused on your current plan. Upgrade for higher usage limits, or wait until your allowance resets."
                : "You've reached the Premium usage limit. Messaging is paused until your allowance resets."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start pl-11 sm:self-center sm:pl-0">
          <div className="bg-surface-container-high/90 text-on-surface flex items-center gap-1.5 rounded-xl border border-[rgba(0,0,0,0.06)] px-3 py-1 font-mono text-xs font-medium">
            {isExpired ? (
              <span className="text-on-surface font-semibold">Resets soon</span>
            ) : (
              <>
                <span className="text-gray-medium font-sans text-[11px]">
                  Resets in
                </span>
                <span className="text-on-surface font-semibold">
                  {countdownText}
                </span>
              </>
            )}
          </div>
          {canUpgrade && (
            <Button
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setPaywallOpen(true)}
            >
              Upgrade
            </Button>
          )}
        </div>
      </div>
      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="quota"
        highlightPlan={isPaidTier(tier) ? "premium" : "go"}
      />
    </div>
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
  initialPromptTag,
}: ChatInputProps) {
  const { data: config, isLoading: isConfigLoading } = useGetConfig();
  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useProfile();
  const [lastSentText, setLastSentText] = useState("");
  const [paywallOpen, setPaywallOpen] = useState(false);

  const isBusy = status === "submitted" || status === "streaming";
  const canStop = isBusy && Boolean(onStop);
  const attachmentsEnabled = config?.enableAttachments ?? true;
  const accept = acceptFromAllowedTypes(config?.attachmentAllowedTypes);
  const maxFiles = config?.attachmentMaxCount ?? 10;
  const maxFileSize = config?.attachmentMaxSize ?? 20_000_000;

  const [nowMs] = useState(() => Date.now());
  const quota = useMemo(
    () => getQuotaSnapshot(profile, nowMs),
    [profile, nowMs],
  );
  const is6hExceeded = quota.pct6h >= 100;
  const isWeeklyExceeded = quota.pctWeekly >= 100;
  const isQuotaExceeded = (is6hExceeded || isWeeklyExceeded) && !isBusy;

  if (isConfigLoading || isProfileLoading) {
    return (
      <div className="bg-background/60 pointer-events-none absolute inset-x-0 bottom-0 z-10 shrink-0 [mask-image:linear-gradient(to_bottom,transparent,black_20%)] px-3 pt-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-4 sm:pt-6 sm:pb-4 md:px-6 md:pt-6 md:pb-6">
        <div className="pointer-events-auto relative mx-auto w-full max-w-[800px]">
          <div className="ambient-shadow flex w-full flex-col overflow-hidden rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-3">
            <Skeleton className="h-14 w-full rounded-md" />
            <div className="mt-3 flex items-center justify-between">
              <Skeleton className="h-8 w-10 rounded-md" />
              <Skeleton className="h-8 w-[240px] rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (message: PromptInputMessage) => {
    const userText = message.text.trim();
    if (!userText || isBusy) return;

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

    onSend(
      userText,
      selectedModel,
      selectedReasoning,
      attachmentIds,
      message.files,
      attachmentMeta,
    );
    setLastSentText(userText);
  };

  const isPremium = normalizeTier(profile?.tier) === "premium";

  return (
    <div className="bg-background/80 pointer-events-none absolute inset-x-0 bottom-0 z-10 shrink-0 [mask-image:linear-gradient(to_bottom,transparent,black_20%)] px-3 pt-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-4 sm:pt-6 sm:pb-4 md:px-6 md:pt-6 md:pb-6">
      <div className="pointer-events-auto relative mx-auto w-full max-w-[800px]">
        {isQuotaExceeded ? (
          <QuotaLimitBanner profile={profile} onRefresh={refetchProfile} />
        ) : (
          <PromptInputProvider initialInput={initialPromptTag ?? ""}>
            <PromptInput
              onSubmit={handleSubmit}
              className="ambient-shadow bg-surface-container-low w-full overflow-hidden rounded-[24px] border border-[rgba(0,0,0,0.06)] transition-all duration-200 [&_[data-slot=input-group]]:!h-auto [&_[data-slot=input-group]]:!border-0 [&_[data-slot=input-group]]:!ring-0"
              accept={attachmentsEnabled ? accept : undefined}
              multiple
              maxFiles={maxFiles}
              maxFileSize={maxFileSize}
              onError={(err) => toast.error(err.message)}
            >
              <ChatInputForm
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                selectedReasoning={selectedReasoning}
                onSelectReasoning={onSelectReasoning}
                status={status}
                onStop={onStop}
                isBusy={isBusy}
                canStop={canStop}
                attachmentsEnabled={attachmentsEnabled}
                lastSentText={lastSentText}
                config={config}
                isPremium={isPremium}
                onUpgradeClick={() => setPaywallOpen(true)}
              />
            </PromptInput>
          </PromptInputProvider>
        )}
      </div>

      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="upgrade"
        highlightPlan="premium"
      />
    </div>
  );
}

"use client";

import { useState, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  Copy,
  Check,
  Code2,
  PenTool,
  Lightbulb,
  Briefcase,
  BookMarked,
  Trash2,
  X,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Maximize2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/ui/logo";
import { toast } from "@/components/ui/toast";
import {
  PromptCategory,
  PromptItem,
  PROMPT_CATEGORIES,
  formatPromptTag,
} from "@/lib/prompt-library";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import { normalizeTier } from "@/lib/plans";
import { PaywallDialog } from "@/components/modules/billing/PaywallDialog";
import { PromptLibraryLockedView } from "./PromptLibraryLockedView";
import { cn } from "@/lib/utils";
import {
  usePrompts,
  useCreatePrompt,
  useDeletePrompt,
} from "@/hooks/data/usePrompts";
import { useDebounce } from "@/hooks/useDebounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const createPromptSchema = z.object({
  title: z.string().min(1, "Title is required").max(60),
  description: z.string().max(120).optional(),
  prompt: z.string().min(1, "Prompt instructions are required"),
});
type CreatePromptValues = z.infer<typeof createPromptSchema>;

const CATEGORY_META: Record<
  string,
  { icon: typeof Code2; label: string; bg: string; text: string }
> = {
  engineering: {
    icon: Code2,
    label: "Engineering",
    bg: "bg-[#E1F3FE]",
    text: "text-[#1F6C9F]",
  },
  writing: {
    icon: PenTool,
    label: "Writing",
    bg: "bg-[#F7F6F3]",
    text: "text-[#5A5A57]",
  },
  product: {
    icon: Briefcase,
    label: "Product",
    bg: "bg-[#EDF3EC]",
    text: "text-[#346538]",
  },
  thinking: {
    icon: Lightbulb,
    label: "Thinking",
    bg: "bg-[#FBF3DB]",
    text: "text-[#956400]",
  },
  custom: {
    icon: BookMarked,
    label: "Custom",
    bg: "bg-[#F7F6F3]",
    text: "text-[#111111]",
  },
};

interface PromptLibraryViewProps {
  headerTabs?: ReactNode;
  onMenuClick?: () => void;
}

export function PromptLibraryView({
  headerTabs,
  onMenuClick: _onMenuClick,
}: PromptLibraryViewProps) {
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const userTier = normalizeTier(profile?.tier);
  const isPremium = userTier === "premium";

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] =
    useState<PromptCategory>("all");

  const {
    data: prompts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePrompts(debouncedQuery, selectedCategory, { enabled: isPremium });

  const createMutation = useCreatePrompt();
  const deleteMutation = useDeletePrompt();

  // Create & Inspect Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inspectPrompt, setInspectPrompt] = useState<PromptItem | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<PromptItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const form = useForm<CreatePromptValues>({
    resolver: zodResolver(createPromptSchema),
    defaultValues: {
      title: "",
      description: "",
      prompt: "",
    },
  });

  const handleCopy = useCallback(async (item: PromptItem) => {
    try {
      const tag = formatPromptTag(item);
      await navigator.clipboard.writeText(tag);
      setCopiedId(item.id);
      toast.success("Prompt copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy prompt");
    }
  }, []);

  const handleCopyRaw = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Template copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy template");
    }
  }, []);

  const handleUseInChat = useCallback(
    (item: PromptItem) => {
      if (!isPremium) {
        setPaywallOpen(true);
        return;
      }
      const tag = formatPromptTag(item);
      router.push(`/chat?prompt=${encodeURIComponent(tag)}`);
    },
    [isPremium, router],
  );

  const handleCreatePrompt = async (values: CreatePromptValues) => {
    if (!isPremium) {
      setCreateDialogOpen(false);
      setPaywallOpen(true);
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: values.title.trim(),
        description: values.description?.trim() || "",
        prompt: values.prompt.trim(),
        tags: ["Custom"],
      });
      toast.success("Custom prompt created");
      setCreateDialogOpen(false);
      form.reset();
    } catch {
      toast.error("Failed to create prompt");
    }
  };

  const confirmDeletePrompt = async () => {
    if (!promptToDelete) return;
    try {
      await deleteMutation.mutateAsync(promptToDelete.id);
      toast.success("Prompt deleted");
      setPromptToDelete(null);
      if (inspectPrompt?.id === promptToDelete.id) {
        setInspectPrompt(null);
      }
    } catch {
      toast.error("Failed to delete prompt");
    }
  };

  const handleOpenCreate = () => {
    if (!isPremium) {
      setPaywallOpen(true);
      return;
    }
    setCreateDialogOpen(true);
  };

  return (
    <div className="flex h-full flex-col bg-[#FBFBFA]">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[#EAEAEA] bg-[#FBFBFA]/95 px-4 backdrop-blur-md lg:px-6">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/chat"
            className="flex items-center transition-opacity select-none hover:opacity-85 md:hidden"
            aria-label="Cognito Chat home"
          >
            <Logo logoOnly iconClassName="size-6 text-[#111111]" />
          </Link>
          <span className="font-light text-neutral-300 select-none md:hidden">
            /
          </span>
          <h1 className="text-base font-semibold tracking-tight text-[#111111] sm:text-lg">
            Library
          </h1>
          {headerTabs}
        </div>

        {/* Desktop Search & Actions */}
        <div className="hidden items-center gap-2.5 sm:flex">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#787774]" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-56 rounded-md border border-[#EAEAEA] bg-white pr-7 pl-8 text-xs text-[#111111] transition-colors placeholder:text-[#787774] focus:border-[#111111] focus:ring-0 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-[#787774] hover:text-[#111111]"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="inline-flex h-8.5 items-center gap-1.5 rounded-full bg-[#111111] px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-[#222222] active:scale-95 dark:bg-white dark:text-[#111111] dark:hover:bg-neutral-100"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Prompt</span>
          </Button>
        </div>

        {/* Mobile Create Action */}
        <div className="flex items-center gap-1.5 sm:hidden">
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="inline-flex h-8.5 items-center gap-1.5 rounded-full bg-[#111111] px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-[#222222] active:scale-95 dark:bg-white dark:text-[#111111] dark:hover:bg-neutral-100"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </Button>
        </div>
      </header>

      {/* ── Mobile Search Bar ── */}
      <div className="border-b border-[#EAEAEA] bg-white px-4 py-2 sm:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#787774]" />
          <input
            type="text"
            placeholder="Search prompt templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-[#EAEAEA] bg-[#FBFBFA] pr-8 pl-8.5 text-xs text-[#111111] placeholder:text-[#787774] focus:border-[#111111] focus:bg-white focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#787774] hover:text-[#111111]"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Row ── */}
      <div className="border-b border-[#EAEAEA] bg-[#FBFBFA] px-4 py-2.5 lg:px-6">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
          {PROMPT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex h-7.5 shrink-0 items-center rounded-md px-3 text-xs font-medium transition-colors select-none",
                  isSelected
                    ? "bg-[#111111] text-white"
                    : "bg-transparent text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]",
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 sm:pb-20 md:pb-6">
        <div className="mx-auto max-w-5xl">
          {/* 1. Gated Showcase State (Non-Premium) */}
          {!isPremium && !isProfileLoading ? (
            <PromptLibraryLockedView onUnlock={() => setPaywallOpen(true)} />
          ) : isError ? (
            /* 2. Error State (R-27) */
            <div className="mx-auto flex min-h-[320px] max-w-md flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 p-8 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-red-900">
                Unable to load prompt library
              </h3>
              <p className="mb-4 text-xs leading-relaxed text-red-700">
                {error instanceof Error
                  ? error.message
                  : "We could not fetch prompt templates at this time."}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                className="h-8 gap-1.5 border-red-200 bg-white text-xs text-red-800 hover:bg-red-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          ) : isLoading || isProfileLoading ? (
            /* 3. Loading State (R-27) */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#EAEAEA] bg-white p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-5 w-12 rounded" />
                  </div>
                  <Skeleton className="mb-2 h-4 w-3/4 rounded" />
                  <Skeleton className="mb-3 h-3.5 w-full rounded" />
                  <Skeleton className="mb-3 h-16 w-full rounded-md" />
                  <div className="flex gap-2 border-t border-[#EAEAEA] pt-3">
                    <Skeleton className="h-8 flex-1 rounded-md" />
                    <Skeleton className="h-8 flex-1 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : prompts.length === 0 ? (
            /* 4. Empty State (R-27) */
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-[#EAEAEA] bg-white p-8 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7F6F3] text-[#787774]">
                <BookMarked className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-[#111111]">
                {searchQuery
                  ? "No matching prompts"
                  : selectedCategory === "custom"
                    ? "No custom prompts yet"
                    : "No prompts in this category"}
              </h3>
              <p className="max-w-sm text-xs leading-relaxed text-[#787774]">
                {searchQuery
                  ? `We could not find any prompts matching "${searchQuery}".`
                  : selectedCategory === "custom"
                    ? "Create your first reusable prompt template to quickly insert instructions in chat."
                    : "There are currently no prompts listed under this filter."}
              </p>
              {searchQuery ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 h-8 rounded-md border-[#EAEAEA] text-xs text-[#111111] hover:bg-[#F7F6F3]"
                >
                  Clear search
                </Button>
              ) : selectedCategory === "custom" ? (
                <Button
                  size="sm"
                  onClick={handleOpenCreate}
                  className="mt-4 h-8 rounded-md bg-[#111111] text-xs font-medium text-white hover:bg-[#222222]"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create prompt
                </Button>
              ) : null}
            </div>
          ) : (
            /* 5. Content Cards Grid */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {prompts.map((prompt) => {
                const isCopied = copiedId === prompt.id;
                const meta =
                  CATEGORY_META[prompt.category] || CATEGORY_META.custom;
                const CategoryIcon = meta.icon;

                return (
                  <Card
                    key={prompt.id}
                    className="group flex flex-col justify-between rounded-xl border border-[#EAEAEA] bg-white p-4 transition-colors hover:border-[#CCCCCC]"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="mb-2.5 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={cn(
                              "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                              meta.bg,
                              meta.text,
                            )}
                          >
                            <CategoryIcon className="h-3 w-3" />
                            <span className="capitalize">{meta.label}</span>
                          </div>

                          {prompt.isCustom && (
                            <span className="rounded border border-[#EAEAEA] bg-[#FBFBFA] px-1.5 py-0.5 text-[10px] font-medium text-[#787774]">
                              Custom
                            </span>
                          )}
                        </div>

                        {/* Actions for Custom Prompt */}
                        {prompt.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPromptToDelete(prompt);
                            }}
                            className="rounded p-1 text-[#787774] transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                            title="Delete custom prompt"
                            aria-label={`Delete ${prompt.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-[#111111]">
                        {prompt.title}
                      </h3>
                      <p className="mt-1 mb-3 line-clamp-2 min-h-[32px] text-xs leading-relaxed text-[#787774]">
                        {prompt.description || "No description provided."}
                      </p>

                      {/* Template Preview Box (Clickable to inspect) */}
                      <div
                        onClick={() => setInspectPrompt(prompt)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setInspectPrompt(prompt);
                          }
                        }}
                        className="group/box relative mb-3 cursor-pointer rounded-md border border-[#EAEAEA] bg-[#FBFBFA] p-2.5 text-[11px] leading-relaxed transition-colors hover:bg-[#F7F6F3]"
                        title="Click to view full prompt"
                      >
                        <div className="line-clamp-3 font-mono text-[#444444] select-text">
                          {prompt.prompt}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#787774]">
                          <span>{prompt.prompt.length} chars</span>
                          <span className="flex items-center gap-0.5 font-medium group-hover/box:text-[#111111]">
                            <Maximize2 className="h-2.5 w-2.5" /> View
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap items-center gap-1">
                          {prompt.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-[#F7F6F3] px-1.5 py-0.5 font-mono text-[10px] text-[#787774]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center gap-2 border-t border-[#EAEAEA] pt-2.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(prompt)}
                        className="h-8.5 flex-1 gap-1.5 rounded-md border-[#EAEAEA] bg-white text-xs font-medium text-[#111111] hover:bg-[#F7F6F3]"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-[#787774]" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleUseInChat(prompt)}
                        className="h-8.5 flex-1 gap-1 rounded-md bg-[#111111] text-xs font-medium text-white transition-colors hover:bg-[#222222]"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>Use in Chat</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog: Prompt Detail / Inspection (C-2 Functional Completeness) ── */}
      <Dialog
        open={Boolean(inspectPrompt)}
        onOpenChange={(open) => !open && setInspectPrompt(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {inspectPrompt && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 pb-1">
                  {(() => {
                    const meta =
                      CATEGORY_META[inspectPrompt.category] ||
                      CATEGORY_META.custom;
                    const Icon = meta.icon;
                    return (
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                          meta.bg,
                          meta.text,
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="capitalize">{meta.label}</span>
                      </span>
                    );
                  })()}
                  {inspectPrompt.isCustom && (
                    <span className="rounded border border-[#EAEAEA] bg-[#FBFBFA] px-1.5 py-0.5 text-[10px] font-medium text-[#787774]">
                      Custom
                    </span>
                  )}
                </div>
                <DialogTitle className="text-base font-semibold text-[#111111]">
                  {inspectPrompt.title}
                </DialogTitle>
                {inspectPrompt.description && (
                  <DialogDescription className="text-xs text-[#787774]">
                    {inspectPrompt.description}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between text-xs text-[#787774]">
                  <span className="font-medium">Prompt Template</span>
                  <span>{inspectPrompt.prompt.length} characters</span>
                </div>

                <div className="max-h-72 overflow-y-auto rounded-md border border-[#EAEAEA] bg-[#F7F6F3] p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-[#111111] select-text">
                  {inspectPrompt.prompt}
                </div>

                {inspectPrompt.tags && inspectPrompt.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {inspectPrompt.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-[#EAEAEA] px-1.5 py-0.5 font-mono text-[10px] text-[#555555]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <div>
                  {inspectPrompt.isCustom && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPromptToDelete(inspectPrompt);
                      }}
                      className="h-8.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopyRaw(inspectPrompt.prompt, inspectPrompt.id)
                    }
                    className="h-8.5 rounded-md border-[#EAEAEA] text-xs font-medium text-[#111111] hover:bg-[#F7F6F3]"
                  >
                    <Copy className="mr-1.5 h-3 w-3 text-[#787774]" />
                    Copy Template
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      handleUseInChat(inspectPrompt);
                      setInspectPrompt(null);
                    }}
                    className="h-8.5 rounded-md bg-[#111111] text-xs font-medium text-white hover:bg-[#222222]"
                  >
                    <MessageSquare className="mr-1.5 h-3 w-3" />
                    Use in Chat
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Create Custom Prompt ── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#111111]">
              Create Custom Prompt
            </DialogTitle>
            <DialogDescription className="text-xs text-[#787774]">
              Add a reusable prompt template to your library. It will appear in
              your @ mention menu in chat.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleCreatePrompt)}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="prompt-title-input"
                  className="text-xs font-semibold text-[#111111]"
                >
                  Prompt Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="prompt-title-input"
                  placeholder="e.g. Code Review & Architecture Audit"
                  {...form.register("title")}
                  maxLength={60}
                  className="h-9 rounded-md border-[#EAEAEA] text-xs focus:border-[#111111] focus:ring-0"
                />
                {form.formState.errors.title && (
                  <p className="text-[11px] text-red-500">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="prompt-desc-input"
                  className="text-xs font-semibold text-[#111111]"
                >
                  Description (Optional)
                </label>
                <Input
                  id="prompt-desc-input"
                  placeholder="Brief note on what this prompt does"
                  {...form.register("description")}
                  maxLength={120}
                  className="h-9 rounded-md border-[#EAEAEA] text-xs focus:border-[#111111] focus:ring-0"
                />
                {form.formState.errors.description && (
                  <p className="text-[11px] text-red-500">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="prompt-template-input"
                    className="text-xs font-semibold text-[#111111]"
                  >
                    Prompt Instructions <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-[#787774]">
                    {form.watch("prompt").length} / 1500 chars
                  </span>
                </div>
                <Textarea
                  id="prompt-template-input"
                  placeholder="Enter the template instructions, context, and steps..."
                  {...form.register("prompt")}
                  maxLength={1500}
                  rows={6}
                  className="rounded-md border-[#EAEAEA] font-mono text-xs leading-relaxed focus:border-[#111111] focus:ring-0"
                />
                {form.formState.errors.prompt && (
                  <p className="text-[11px] text-red-500">
                    {form.formState.errors.prompt.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createMutation.isPending}
                className="h-8.5 rounded-md border-[#EAEAEA] text-xs text-[#111111] hover:bg-[#F7F6F3]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="h-8.5 rounded-md bg-[#111111] text-xs font-medium text-white hover:bg-[#222222]"
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Save Prompt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirm Delete Custom Prompt ── */}
      <Dialog
        open={Boolean(promptToDelete)}
        onOpenChange={(open) => !open && setPromptToDelete(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#111111]">
              Delete Custom Prompt?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#787774]">
              Are you sure you want to delete &ldquo;{promptToDelete?.title}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPromptToDelete(null)}
              disabled={deleteMutation.isPending}
              className="h-8.5 rounded-md border-[#EAEAEA] text-xs text-[#111111] hover:bg-[#F7F6F3]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={confirmDeletePrompt}
              disabled={deleteMutation.isPending}
              className="h-8.5 rounded-md text-xs font-medium"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paywall Dialog */}
      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="upgrade"
        highlightPlan="premium"
      />
    </div>
  );
}

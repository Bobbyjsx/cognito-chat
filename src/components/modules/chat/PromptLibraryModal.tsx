"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Sparkles,
  Lock,
  Plus,
  Trash2,
  Check,
  Code2,
  PenTool,
  Compass,
  Lightbulb,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/useDebounce";
import {
  usePrompts,
  useCreatePrompt,
  useDeletePrompt,
} from "@/hooks/data/usePrompts";
import {
  PROMPT_CATEGORIES,
  type PromptCategory,
  type PromptItem,
} from "@/lib/prompt-library";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import { normalizeTier } from "@/lib/plans";
import { cn } from "@/lib/utils";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

const createPromptSchema = z.object({
  title: z.string().min(1, "Title is required").max(60),
  description: z.string().max(120).optional(),
  prompt: z.string().min(1, "Prompt instructions are required"),
});
type CreatePromptValues = z.infer<typeof createPromptSchema>;

interface PromptLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrompt?: (prompt: PromptItem) => void;
  onUpgradeClick?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <Sparkles className="h-3.5 w-3.5" />,
  engineering: <Code2 className="h-3.5 w-3.5" />,
  writing: <PenTool className="h-3.5 w-3.5" />,
  product: <Compass className="h-3.5 w-3.5" />,
  thinking: <Lightbulb className="h-3.5 w-3.5" />,
  custom: <FolderOpen className="h-3.5 w-3.5" />,
};

export function PromptLibraryModal({
  open,
  onOpenChange,
  onSelectPrompt,
  onUpgradeClick,
}: PromptLibraryModalProps) {
  const { data: profile } = useProfile();
  const isPremium = normalizeTier(profile?.tier) === "premium";

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [activeCategory, setActiveCategory] = useState<PromptCategory>("all");

  const { data: filteredPrompts = [], isLoading: isLoadingPrompts } =
    usePrompts(debouncedQuery, activeCategory, { enabled: isPremium });
  const createMutation = useCreatePrompt();
  const deleteMutation = useDeletePrompt();

  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // New prompt form state
  const form = useForm<CreatePromptValues>({
    resolver: zodResolver(createPromptSchema),
    defaultValues: {
      title: "",
      description: "",
      prompt: "",
    },
  });

  useEffect(() => {
    if (open) {
      setIsCreatingCustom(false);
      setSearchQuery("");
      form.reset();
    }
  }, [open, form]);

  const handleSelect = (prompt: PromptItem) => {
    if (!isPremium) {
      toast.info("Prompt library is available on the Premium plan.");
      onUpgradeClick?.();
      return;
    }
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
      onOpenChange(false);
    } else {
      void navigator.clipboard.writeText(prompt.prompt);
      toast.success("Prompt template copied to clipboard");
    }
  };

  const handleCreateCustom = async (values: CreatePromptValues) => {
    if (!isPremium) {
      toast.info("Custom prompts require a Premium plan.");
      onUpgradeClick?.();
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: values.title,
        description:
          values.description?.trim() || "User custom prompt template",
        prompt: values.prompt,
        tags: ["Custom"],
      });

      toast.success("Custom prompt saved");
      form.reset();
      setIsCreatingCustom(false);
      setActiveCategory("custom");
    } catch {
      toast.error("Failed to create custom prompt");
    }
  };

  const handleDeleteCustom = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Custom prompt deleted");
    } catch {
      toast.error("Failed to delete custom prompt");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* Header */}
        <div className="border-b border-[rgba(0,0,0,0.06)] bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-on-surface text-base font-semibold">
                    Prompt Library
                  </DialogTitle>
                  {!isPremium && (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-800"
                    >
                      <Lock className="mr-1 inline h-3 w-3" />
                      Premium Feature
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-gray-medium mt-0.5 text-xs">
                  Pre-configured prompts crafted for coding, writing,
                  architecture, and reasoning.
                </DialogDescription>
              </div>
            </div>

            {isPremium && !isCreatingCustom && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingCustom(true)}
                className="text-xs font-medium"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Prompt
              </Button>
            )}
          </div>

          {/* Search bar (when not creating) */}
          {!isCreatingCustom && (
            <div className="relative mt-4">
              <Search className="text-gray-medium absolute top-2.5 left-3 h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts by title, description, or keyword…"
                className="h-9 pl-9 text-xs"
              />
            </div>
          )}
        </div>

        {/* Upgrade Banner for Non-Premium Users */}
        {!isPremium && (
          <div className="flex items-center justify-between border-b border-amber-200/60 bg-amber-50/70 px-5 py-2.5 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0 text-amber-700" />
              <span>
                Upgrade to <strong>Premium</strong> to attach these prompts and
                save custom templates.
              </span>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                onOpenChange(false);
                onUpgradeClick?.();
              }}
              className="ml-2 h-7 shrink-0 px-2.5 text-xs"
            >
              Upgrade
            </Button>
          </div>
        )}

        {/* Content Area */}
        {isCreatingCustom ? (
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-2">
              <h4 className="text-on-surface text-xs font-semibold">
                Create Custom Prompt
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreatingCustom(false)}
                className="text-gray-medium h-7 px-2 text-xs"
              >
                Cancel
              </Button>
            </div>

            <form
              onSubmit={form.handleSubmit(handleCreateCustom)}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="mb-1 block font-medium text-neutral-700">
                  Prompt Title <span className="text-red-500">*</span>
                </label>
                <Input
                  {...form.register("title")}
                  placeholder="e.g. Next.js Architecture Auditor"
                  className="h-8 text-xs"
                  maxLength={60}
                />
                {form.formState.errors.title && (
                  <p className="mt-1 text-[10px] text-red-500">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block font-medium text-neutral-700">
                  Description
                </label>
                <Input
                  {...form.register("description")}
                  placeholder="e.g. Audits Next.js App Router patterns and server components"
                  className="h-8 text-xs"
                  maxLength={120}
                />
                {form.formState.errors.description && (
                  <p className="mt-1 text-[10px] text-red-500">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-medium text-neutral-700">
                    Prompt Text <span className="text-red-500">*</span>
                  </label>
                  <span className="text-gray-medium text-[10px]">
                    {form.watch("prompt").length} / 2000 chars
                  </span>
                </div>
                <Textarea
                  {...form.register("prompt")}
                  placeholder="Write the instruction template that will be applied to the chat..."
                  className="h-32 resize-none text-xs leading-relaxed"
                  maxLength={2000}
                />
                {form.formState.errors.prompt && (
                  <p className="mt-1 text-[10px] text-red-500">
                    {form.formState.errors.prompt.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingCustom(false)}
                  className="text-xs"
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="text-xs"
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save to Library
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Category pills */}
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-b border-[rgba(0,0,0,0.06)] bg-neutral-50/50 px-5 py-3">
              {PROMPT_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary text-on-primary shadow-xs"
                        : "text-gray-medium hover:text-on-surface border border-[rgba(0,0,0,0.06)] bg-white hover:bg-neutral-100",
                    )}
                  >
                    {CATEGORY_ICONS[cat.id]}
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Prompt Cards List */}
            <div className="flex-1 space-y-2.5 overflow-y-auto p-5">
              {filteredPrompts.length === 0 ? (
                <div className="text-gray-medium py-12 text-center">
                  <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-xs font-medium">No prompts found</p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    {searchQuery
                      ? "Try searching for another keyword"
                      : "Create your first custom prompt to get started"}
                  </p>
                </div>
              ) : (
                filteredPrompts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "group hover:border-primary/30 relative flex cursor-pointer flex-col justify-between gap-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-3.5 text-left transition-all duration-150 hover:shadow-xs sm:flex-row sm:items-center",
                      !isPremium && "opacity-90",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-on-surface group-hover:text-primary truncate text-xs font-semibold transition-colors">
                          {item.title}
                        </span>
                        {item.isCustom ? (
                          <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[9px] tracking-wider uppercase"
                          >
                            Custom
                          </Badge>
                        ) : (
                          <span className="text-gray-medium text-[10px] capitalize">
                            • {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-medium line-clamp-1 text-[11px] leading-normal">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {item.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustom(e, item.id)}
                          className="text-gray-medium rounded-md p-1.5 transition-colors hover:text-red-600"
                          title="Delete prompt"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="group-hover:bg-primary group-hover:text-on-primary h-7 text-xs font-medium transition-colors"
                      >
                        {!isPremium ? (
                          <>
                            <Lock className="mr-1 h-3 w-3" />
                            Use Prompt
                          </>
                        ) : (
                          <>
                            Use Prompt
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

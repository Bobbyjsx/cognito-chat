"use client";

import React, { useRef, useEffect } from "react";
import {
  Sparkles,
  Paperclip,
  Code2,
  PenTool,
  Compass,
  Lightbulb,
  FolderOpen,
  Lock,
} from "lucide-react";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  PROMPT_CATEGORIES,
  type PromptCategory,
  type PromptItem,
} from "@/lib/prompt-library";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <Sparkles className="h-3.5 w-3.5" />,
  engineering: <Code2 className="h-3.5 w-3.5" />,
  writing: <PenTool className="h-3.5 w-3.5" />,
  product: <Compass className="h-3.5 w-3.5" />,
  thinking: <Lightbulb className="h-3.5 w-3.5" />,
  custom: <FolderOpen className="h-3.5 w-3.5" />,
};

interface ChatMentionPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  prompts: PromptItem[];
  isLoading?: boolean;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  activeCategory: PromptCategory;
  onCategoryChange: (category: PromptCategory) => void;
  onSelectPrompt: (prompt: PromptItem) => void;
  onAttachClick?: () => void;
  onUpgradeClick?: () => void;
  isPremium?: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function ChatMentionPopover({
  open,
  onOpenChange,
  query,
  prompts,
  isLoading = false,
  selectedIndex,
  onSelectIndex,
  activeCategory,
  onCategoryChange,
  onSelectPrompt,
  onAttachClick,
  onUpgradeClick,
  isPremium = false,
  anchorRef,
}: ChatMentionPopoverProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hasQuery = query.trim().length > 0;
  const toolsCount = !hasQuery && onAttachClick ? 1 : 0;

  useEffect(() => {
    if (open && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [open, selectedIndex]);

  const handlePromptClick = (prompt: PromptItem) => {
    if (!isPremium) {
      onUpgradeClick?.();
      return;
    }
    onSelectPrompt(prompt);
  };

  const shouldClose =
    isPremium && hasQuery && prompts.length === 0 && !isLoading;
  const isOpen = open && !shouldClose;

  useEffect(() => {
    if (shouldClose && onOpenChange) {
      onOpenChange(false);
    }
  }, [shouldClose, onOpenChange]);

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverContent
        anchor={anchorRef}
        side="top"
        align="start"
        sideOffset={8}
        initialFocus={false}
        className="animate-in fade-in zoom-in-95 z-50 w-80 overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-white p-0 shadow-xl duration-150 sm:w-96"
      >
        <div className="flex max-h-[380px] flex-col">
          {/* Header */}
          <div className="bg-surface-container-low/50 flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                {hasQuery
                  ? `Prompts matching "@${query}"`
                  : "Insert or Mention"}
              </span>
              {hasQuery && (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 text-[10px] font-medium"
                >
                  {prompts.length}
                </Badge>
              )}
            </div>
            {!isPremium && (
              <Badge
                variant="outline"
                className="border-amber-500/20 bg-amber-500/10 px-1.5 py-0 text-[9px] font-medium text-amber-700"
              >
                <Lock className="mr-0.5 h-2.5 w-2.5" /> Premium
              </Badge>
            )}
          </div>

          {!hasQuery && onAttachClick && (
            <div className="space-y-0.5 border-b border-[rgba(0,0,0,0.06)] p-1">
              <button
                type="button"
                ref={(el) => {
                  itemRefs.current[0] = el;
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={onAttachClick}
                onMouseEnter={() => onSelectIndex(0)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  selectedIndex === 0
                    ? "bg-surface-container-low text-on-surface"
                    : "hover:bg-surface-container-low/60 text-on-surface",
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="bg-surface-container text-on-surface flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                    <Paperclip className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-on-surface text-xs font-semibold">
                      Attach Files
                    </span>
                    <p className="text-muted-foreground truncate text-[11px]">
                      Upload documents, images, or code
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex scrollbar-none items-center gap-1 overflow-x-auto border-b border-[rgba(0,0,0,0.04)] px-2.5 py-1.5">
            {PROMPT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  "inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                  activeCategory === cat.id
                    ? "bg-primary text-on-primary font-semibold"
                    : "bg-surface-container-low text-muted-foreground hover:text-on-surface hover:bg-surface-container",
                )}
              >
                {CATEGORY_ICONS[cat.id]}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Prompts Scrollable List */}
          <div className="max-h-60 flex-1 space-y-0.5 overflow-y-auto p-1.5">
            {isLoading ? (
              <div className="space-y-1 p-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2">
                    <Skeleton className="mt-0.5 h-6 w-6 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-2.5 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !isPremium ? (
              <div className="space-y-2 p-4 text-center">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="text-xs font-semibold text-neutral-900">
                  Prompt Library is a Premium feature
                </div>
                <p className="text-muted-foreground mx-auto max-w-[240px] text-[11px]">
                  Upgrade to Cognito Premium to search and insert prompt
                  templates with @.
                </p>
                {onUpgradeClick && (
                  <button
                    type="button"
                    onClick={onUpgradeClick}
                    className="inline-flex cursor-pointer items-center gap-1 pt-1 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    <Sparkles className="h-3 w-3" />
                    Upgrade to Premium
                  </button>
                )}
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-muted-foreground py-6 text-center text-xs">
                No prompts matching &ldquo;{query}&rdquo;
              </div>
            ) : (
              prompts.map((prompt, pIdx) => {
                const globalIdx = toolsCount + pIdx;
                const isSelected = selectedIndex === globalIdx;

                return (
                  <button
                    key={prompt.id}
                    type="button"
                    ref={(el) => {
                      itemRefs.current[globalIdx] = el;
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePromptClick(prompt)}
                    onMouseEnter={() => onSelectIndex(globalIdx)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-2.5 rounded-lg p-2 text-left transition-colors",
                      isSelected
                        ? "bg-surface-container-low text-on-surface ring-primary/20 ring-1"
                        : "hover:bg-surface-container-low/60 text-on-surface",
                    )}
                  >
                    <div className="bg-primary/10 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                      {CATEGORY_ICONS[prompt.category] || (
                        <Sparkles className="h-3 w-3" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-on-surface truncate text-xs font-semibold">
                          {prompt.title}
                        </span>
                        {prompt.isCustom && (
                          <Badge
                            variant="secondary"
                            className="px-1 py-0 text-[8px] font-semibold"
                          >
                            Custom
                          </Badge>
                        )}
                        {!isPremium && (
                          <Lock className="text-muted-foreground ml-auto h-2.5 w-2.5 shrink-0" />
                        )}
                      </div>
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px] leading-normal">
                        {prompt.description}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer keyboard hint */}
          <div className="bg-surface-container-low/30 text-muted-foreground flex items-center justify-between border-t border-[rgba(0,0,0,0.06)] px-3 py-1.5 text-[10px]">
            <span>Use ↑ ↓ to navigate</span>
            <span>↵ or click to insert</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

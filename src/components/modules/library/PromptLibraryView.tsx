import { useState, ReactNode, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Copy,
  Check,
  Code2,
  PenTool,
  Lightbulb,
  Briefcase,
  Sparkles,
  ArrowRight,
  Trash2,
  Menu,
  Lock,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Loader2 } from "lucide-react";

const createPromptSchema = z.object({
  title: z.string().min(1, "Title is required").max(60),
  description: z.string().max(120).optional(),
  prompt: z.string().min(1, "Prompt instructions are required"),
});
type CreatePromptValues = z.infer<typeof createPromptSchema>;

const CATEGORY_ICONS: Record<string, ReactNode> = {
  engineering: <Code2 className="h-4 w-4" />,
  writing: <PenTool className="h-4 w-4" />,
  product: <Briefcase className="h-4 w-4" />,
  thinking: <Lightbulb className="h-4 w-4" />,
  custom: <Sparkles className="h-4 w-4" />,
};

interface PromptLibraryViewProps {
  headerTabs?: ReactNode;
  onMenuClick?: () => void;
}

export function PromptLibraryView({
  headerTabs,
  onMenuClick,
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

  const { data: prompts = [], isLoading } = usePrompts(
    debouncedQuery,
    selectedCategory,
    { enabled: isPremium },
  );
  const createMutation = useCreatePrompt();
  const deleteMutation = useDeletePrompt();

  // Create Prompt State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const form = useForm<CreatePromptValues>({
    resolver: zodResolver(createPromptSchema),
    defaultValues: {
      title: "",
      description: "",
      prompt: "",
    },
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

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
        title: values.title,
        description: values.description || "",
        prompt: values.prompt,
        tags: ["Custom"],
      });
      toast.success("Custom prompt created.");
      setCreateDialogOpen(false);
      form.reset();
    } catch {
      toast.error("Failed to create prompt.");
    }
  };

  const handleDeletePrompt = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Prompt deleted");
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
    <div className="flex h-full flex-col">
      <header className="bg-surface-container-low sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-surface-container hover:text-on-surface h-9 w-9 shrink-0 md:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-on-surface text-base font-semibold tracking-tight sm:text-lg">
            Library
          </h1>
          {headerTabs}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-input focus:ring-ring h-9 w-64 rounded-full border bg-transparent pr-4 pl-9 text-sm focus:ring-1 focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* Filter Row */}
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {PROMPT_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "ghost"}
              className="h-8 rounded-full px-4 whitespace-nowrap"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className={cn(
            "hidden h-8 rounded-full sm:flex",
            !isPremium &&
              "border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600",
          )}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Custom
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#FDFDFD] p-4">
        <div className="mx-auto h-full max-w-5xl">
          {!isPremium && !isProfileLoading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center shadow-xs">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Lock className="h-7 w-7" />
              </div>
              <Badge
                variant="outline"
                className="mb-3 border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-800"
              >
                Cognito Premium Exclusive
              </Badge>
              <h3 className="text-on-surface mb-2 text-xl font-semibold tracking-tight">
                Prompt Library is locked
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md text-sm">
                Upgrade to Cognito Premium to browse, search, and insert our
                curated library of engineering, writing, and analysis prompts,
                plus create your own custom prompt templates.
              </p>
              <Button
                onClick={() => setPaywallOpen(true)}
                className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 font-medium text-white shadow-sm hover:from-amber-600 hover:to-orange-600"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Button>
            </div>
          ) : isLoading || isProfileLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4 shadow-xs">
                  <div className="mb-2 flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="mb-1 h-5 w-3/4" />
                  <Skeleton className="mb-3 h-4 w-full" />
                  <Skeleton className="mb-3 h-16 w-full rounded-lg" />
                  <div className="mb-3 flex gap-1">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex gap-2 border-t pt-2">
                    <Skeleton className="h-7 flex-1" />
                    <Skeleton className="h-7 flex-1" />
                  </div>
                </Card>
              ))}
            </div>
          ) : prompts.length === 0 ? (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(0,0,0,0.1)] bg-white p-8 text-center">
              <div className="bg-primary/10 text-primary mb-4 rounded-full p-4">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-on-surface mb-2 text-lg font-semibold">
                No prompts found
              </h3>
              <p className="text-muted-foreground max-w-sm text-sm">
                {searchQuery
                  ? "We couldn't find any prompts matching your search."
                  : selectedCategory === "custom"
                    ? "You haven't created any custom prompts yet."
                    : "No prompts in this category."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prompts.map((prompt) => {
                const isCopied = copiedId === prompt.id;

                return (
                  <Card
                    key={prompt.id}
                    className="group flex flex-col justify-between overflow-hidden border border-[rgba(0,0,0,0.06)] bg-white p-4 shadow-xs transition-all hover:border-[rgba(0,0,0,0.12)] hover:shadow-md"
                  >
                    <div>
                      {/* Header */}
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
                            {CATEGORY_ICONS[prompt.category] || (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-medium capitalize"
                          >
                            {prompt.category}
                          </Badge>
                          {prompt.isCustom && (
                            <Badge
                              variant="outline"
                              className="border-primary/20 bg-primary/10 text-primary text-[10px] font-semibold"
                            >
                              Custom
                            </Badge>
                          )}
                        </div>

                        {prompt.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeletePrompt(prompt.id, e)}
                            className="text-muted-foreground hover:bg-surface-container rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
                            title="Delete prompt"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-on-surface mb-1 line-clamp-1 text-sm font-semibold">
                        {prompt.title}
                      </h3>
                      <p className="text-muted-foreground mb-3 line-clamp-2 text-xs leading-relaxed">
                        {prompt.description}
                      </p>

                      {/* Template Snippet Box */}
                      <div className="bg-surface-container-low/60 text-muted-foreground mb-3 line-clamp-3 rounded-lg border border-[rgba(0,0,0,0.04)] p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text">
                        {prompt.prompt}
                      </div>

                      {/* Tags */}
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap items-center gap-1">
                          {prompt.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-surface-container text-muted-foreground rounded px-1.5 py-0.5 text-[9px] font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center gap-2 border-t border-[rgba(0,0,0,0.04)] pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(prompt)}
                        className="h-7 flex-1 gap-1.5 text-xs"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="font-medium text-emerald-600">
                              Copied
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleUseInChat(prompt)}
                        className="h-7 flex-1 gap-1 text-xs"
                      >
                        <span>Use in Chat</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Create Custom Prompt */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Prompt</DialogTitle>
            <DialogDescription>
              Add a reusable prompt template to your library. It will appear in
              your @ mention menu in chat.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleCreatePrompt)}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-on-surface text-xs font-semibold">
                  Prompt Title <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., Code Review & Security Audit"
                  {...form.register("title")}
                  maxLength={60}
                  className="text-xs"
                />
                {form.formState.errors.title && (
                  <p className="text-[10px] text-red-500">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface text-xs font-semibold">
                  Description (Optional)
                </label>
                <Input
                  placeholder="Short summary of what this prompt does"
                  {...form.register("description")}
                  maxLength={120}
                  className="text-xs"
                />
                {form.formState.errors.description && (
                  <p className="text-[10px] text-red-500">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-on-surface text-xs font-semibold">
                    Prompt Instructions / Template{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-muted-foreground text-[10px]">
                    {form.watch("prompt").length} / 1500 chars
                  </span>
                </div>
                <Textarea
                  placeholder="Enter instructions, questions, or context that the AI should follow..."
                  {...form.register("prompt")}
                  maxLength={1500}
                  rows={5}
                  className="font-mono text-xs"
                />
                {form.formState.errors.prompt && (
                  <p className="text-[10px] text-red-500">
                    {form.formState.errors.prompt.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Prompt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="upgrade"
        highlightPlan="premium"
      />
    </div>
  );
}

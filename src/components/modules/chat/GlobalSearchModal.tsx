"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  History,
  SquarePen,
  Image as ImageIcon,
  Settings,
  Brain,
  ArrowRight,
  Check,
  Search,
  X,
  Command as CommandIcon,
  Cpu,
} from "lucide-react";
import { useGetSessions } from "@/hooks/data/useChats/useChats";
import { useGetConfig } from "@/hooks/data/useConfig/useConfig";
import type { ChatSessionListItem } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

export type PaletteTab = "all" | "chats" | "models" | "actions";

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: PaletteTab;
  activeSessionId?: string | null;
  activeModel?: string;
  onSelectModel?: (model: string) => void;
  activeReasoning?: string;
  onSelectReasoning?: (reasoning: string) => void;
  onNewChat?: () => void;
}

function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return "";

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getProviderInfo(modelId: string): { provider: string; color: string } {
  const id = modelId.toLowerCase();
  if (id.includes("gemini")) {
    return {
      provider: "Google",
      color:
        "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
    };
  }
  if (id.includes("claude")) {
    return {
      provider: "Anthropic",
      color:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    };
  }
  if (
    id.includes("gpt") ||
    id.includes("o1") ||
    id.includes("o3") ||
    id.includes("o4")
  ) {
    return {
      provider: "OpenAI",
      color:
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    };
  }
  if (id.includes("deepseek")) {
    return {
      provider: "DeepSeek",
      color:
        "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20",
    };
  }
  return {
    provider: "AI Model",
    color:
      "bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/20",
  };
}

import { formatModelDisplayName as formatModelLabel } from "@/lib/models";

export function GlobalSearchModal({
  open,
  onOpenChange,
  defaultTab = "all",
  activeSessionId,
  activeModel = "Auto",
  onSelectModel,
  activeReasoning = "balanced",
  onSelectReasoning,
  onNewChat,
}: GlobalSearchModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<PaletteTab>(defaultTab);
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [selectedModelId, setSelectedModelId] = React.useState(activeModel);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const prevOpenRef = React.useRef(false);

  const { data: config } = useGetConfig();

  // Reset state strictly when modal is opened (not on internal model/reasoning selection)
  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      setSearchInput("");
      setDebouncedQuery("");
      setActiveTab(defaultTab);
      setSelectedModelId(activeModel);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    prevOpenRef.current = open;
  }, [open, defaultTab, activeModel]);

  // Debounce search input for backend chat search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: sessionsData, isLoading: isSessionsLoading } =
    useGetSessions(debouncedQuery);

  const sessions = React.useMemo(() => {
    if (!sessionsData?.pages) return [];
    const seen = new Set<string>();
    const unique: ChatSessionListItem[] = [];
    for (const page of sessionsData.pages) {
      if (!page?.items) continue;
      for (const session of page.items) {
        if (session?.id && !seen.has(session.id)) {
          seen.add(session.id);
          unique.push(session);
        }
      }
    }
    return unique;
  }, [sessionsData]);

  // Available models derived from AppConfig
  const availableModels = React.useMemo(() => {
    const rawList = config?.modelsList;
    if (!rawList) {
      return [
        {
          id: "gemini-3.6-flash",
          name: "Gemini 3.6 Flash",
          description: "Ultra-fast multimodal reasoning & high throughput",
          reasoningModes: ["low", "medium", "high"],
        },
        {
          id: "gemini-3.1-pro-preview",
          name: "Gemini 3.1 Pro Preview",
          description: "Deep reasoning, code execution & 2M context window",
          reasoningModes: ["low", "medium", "high"],
        },
        {
          id: "gpt-4o",
          name: "GPT-4o",
          description:
            "Omni-model for general intelligence & multimodal analysis",
          reasoningModes: ["low", "medium", "high"],
        },
        {
          id: "claude-3-5-sonnet",
          name: "Claude 3.5 Sonnet",
          description: "State-of-the-art coding, analysis & agentic workflows",
          reasoningModes: ["low", "medium", "high"],
        },
        {
          id: "deepseek-r1",
          name: "DeepSeek R1",
          description: "Open reasoning model optimized for math, logic & code",
          reasoningModes: ["low", "medium", "high"],
        },
      ];
    }

    const autoModel = {
      id: "Auto",
      name: "Auto (Smart Router)",
      description:
        rawList["auto"]?.description ||
        "Intelligent automatic model routing based on query complexity and intent",
      reasoningModes: ["fast", "balanced", "extended"],
    };

    const models = Object.entries(rawList)
      .filter(([id, cfg]) => cfg.enabled && id.toLowerCase() !== "auto")
      .map(([id, cfg]) => ({
        id,
        name: formatModelLabel(id),
        description: cfg.description || "General intelligence model",
        reasoningModes: cfg.reasoningModes || ["fast", "balanced", "extended"],
      }));

    return [autoModel, ...models];
  }, [config]);

  // Filtered models
  const filteredModels = React.useMemo(() => {
    const q = searchInput.toLowerCase().trim();
    if (!q) return availableModels;
    return availableModels.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        getProviderInfo(m.id).provider.toLowerCase().includes(q),
    );
  }, [availableModels, searchInput]);

  // Actions list
  const actions = React.useMemo(() => {
    return [
      {
        id: "new-chat",
        title: "New Conversation",
        description: "Start a fresh chat with active model",
        shortcut: "⌘N",
        icon: SquarePen,
        onSelect: () => {
          onOpenChange(false);
          onNewChat?.();
          router.push("/chat");
        },
      },
      {
        id: "library",
        title: "Prompt Library",
        description: "Browse prompt templates and saved artifacts",
        shortcut: "⌘L",
        icon: ImageIcon,
        onSelect: () => {
          onOpenChange(false);
          router.push("/library");
        },
      },
      {
        id: "settings",
        title: "Settings & Token Quota",
        description: "Manage account preferences and quotas",
        shortcut: "⌘,",
        icon: Settings,
        onSelect: () => {
          onOpenChange(false);
          router.push("/settings");
        },
      },
    ];
  }, [onNewChat, onOpenChange, router]);

  const filteredActions = React.useMemo(() => {
    const q = searchInput.toLowerCase().trim();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  }, [actions, searchInput]);

  // Handle Model Selection: Keeps modal OPEN on the current tab so reasoning mode can be picked
  const handleSelectModel = React.useCallback(
    (modelId: string) => {
      setSelectedModelId(modelId);

      if (onSelectModel) {
        onSelectModel(modelId);
      }

      const modelObj = availableModels.find((m) => m.id === modelId);
      if (!modelObj?.reasoningModes || modelObj.reasoningModes.length === 0) {
        onOpenChange(false);
        toast.success(`Switched model to ${formatModelLabel(modelId)}`);
      } else {
        toast.info(
          `Selected ${formatModelLabel(modelId)}. Choose a reasoning depth below.`,
        );
      }
    },
    [availableModels, onOpenChange, onSelectModel],
  );

  // Handle Reasoning Selection: Applies reasoning AND closes modal
  const handleSelectReasoning = React.useCallback(
    (level: string) => {
      onOpenChange(false);

      if (onSelectReasoning) {
        onSelectReasoning(level);
      }
      toast.success(
        `Model set to ${formatModelLabel(selectedModelId)} with ${level} reasoning`,
      );
    },
    [onOpenChange, onSelectReasoning, selectedModelId],
  );

  // Keyboard navigation for tabs
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const tabList: PaletteTab[] = ["all", "chats", "models", "actions"];
      const nextIdx =
        (tabList.indexOf(activeTab) + (e.shiftKey ? -1 : 1) + tabList.length) %
        tabList.length;
      setActiveTab(tabList[nextIdx]);
    }
  };

  const tabs: {
    id: PaletteTab;
    label: string;
    mobileLabel: string;
    count?: number;
  }[] = [
    { id: "all", label: "All", mobileLabel: "All" },
    {
      id: "chats",
      label: "Conversations",
      mobileLabel: "Chats",
      count: sessions.length,
    },
    {
      id: "models",
      label: "Models & Reasoning",
      mobileLabel: "Models",
      count: availableModels.length,
    },
    {
      id: "actions",
      label: "Actions",
      mobileLabel: "Actions",
      count: actions.length,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-border/80 top-[8%] w-full max-w-[calc(100vw-1rem)] translate-y-0 overflow-hidden rounded-2xl border bg-white p-0 shadow-2xl sm:top-[12%] sm:max-w-[640px] md:max-w-[720px] dark:bg-[#18181b]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Workspace Command Palette</DialogTitle>
          <DialogDescription>
            Search conversations, switch AI models, control reasoning, and
            execute actions.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="border-border/60 flex items-center gap-3 border-b px-4 py-3.5 sm:py-4">
          <Search className="text-muted-foreground h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              activeTab === "chats"
                ? "Search past conversations..."
                : activeTab === "models"
                  ? "Search AI models..."
                  : activeTab === "actions"
                    ? "Search workspace actions..."
                    : "Search chats, models, actions..."
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-foreground placeholder:text-muted-foreground/60 w-full min-w-0 bg-transparent text-[14px] font-normal outline-none sm:text-[15px]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="text-muted-foreground hover:text-foreground rounded p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tab Switcher Header (Responsive, No Overflow Clipping) */}
        <div className="border-border/50 bg-muted/30 flex [scrollbar-width:none] items-center gap-1.5 overflow-x-auto border-b px-3 py-1.5 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.mobileLabel}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      "py-0.2 rounded px-1 font-mono text-[10px]",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground/70",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Body */}
        <div className="h-[360px] max-h-[60dvh] overflow-y-auto p-2.5 sm:h-[420px] sm:p-3">
          {/* ─── TAB: ALL or ACTIONS ─── */}
          {(activeTab === "all" || activeTab === "actions") &&
            filteredActions.length > 0 && (
              <div className="mb-3 space-y-1">
                <div className="text-muted-foreground/70 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider uppercase">
                  Workspace Actions
                </div>
                {filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={action.onSelect}
                      className="hover:bg-muted/70 group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="bg-surface-container-high/80 text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.06)]">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-foreground truncate text-[13px] font-medium">
                            {action.title}
                          </div>
                          <div className="text-muted-foreground truncate text-[11px]">
                            {action.description}
                          </div>
                        </div>
                      </div>
                      {action.shortcut && (
                        <kbd className="bg-muted text-muted-foreground shrink-0 rounded border border-[rgba(0,0,0,0.06)] px-1.5 py-0.5 font-mono text-[10px]">
                          {action.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

          {/* ─── TAB: ALL or MODELS ─── */}
          {(activeTab === "all" || activeTab === "models") &&
            filteredModels.length > 0 && (
              <div className="mb-3 space-y-1">
                <div className="text-muted-foreground/70 flex items-center justify-between px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider uppercase">
                  <span>AI Models</span>
                  <span className="text-muted-foreground/60 font-sans text-[10px] normal-case">
                    Click model to set reasoning depth
                  </span>
                </div>
                <div className="space-y-2">
                  {filteredModels.map((m) => {
                    const isSelected = selectedModelId === m.id;
                    const isCurrentlyActive = activeModel === m.id;
                    const provider = getProviderInfo(m.id);

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "group rounded-xl border p-3 transition-all",
                          isSelected
                            ? "border-primary/40 bg-primary/[0.04] ring-primary/20 shadow-xs ring-1"
                            : "border-border/60 hover:bg-muted/40 hover:border-border",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectModel(m.id)}
                            className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                          >
                            <div
                              className={cn(
                                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors",
                                isSelected
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-border/60 bg-muted/60 text-muted-foreground",
                              )}
                            >
                              <Cpu className="h-3.5 w-3.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="text-foreground text-[13px] font-semibold">
                                  {m.name}
                                </span>
                                <span
                                  className={cn(
                                    "py-0.2 rounded px-1.5 font-mono text-[10px] font-medium",
                                    provider.color,
                                  )}
                                >
                                  {provider.provider}
                                </span>
                                {isCurrentlyActive && (
                                  <span className="bg-primary/15 text-primary border-primary/30 py-0.2 flex items-center gap-1 rounded-full border px-1.5 font-mono text-[9px] font-semibold tracking-wide uppercase">
                                    <Check className="h-2.5 w-2.5" />
                                    Active
                                  </span>
                                )}
                              </div>

                              <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed break-words">
                                {m.description}
                              </p>
                            </div>
                          </button>
                        </div>

                        {/* Inline Reasoning Depth Selector */}
                        {isSelected && m.reasoningModes.length > 0 && (
                          <div className="border-border/50 mt-3 border-t pt-2.5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                                <Brain className="text-primary h-3.5 w-3.5 shrink-0" />
                                <span>Select reasoning mode to apply:</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {m.reasoningModes.map((level) => {
                                  const isReasoningActive =
                                    activeReasoning.toLowerCase() ===
                                    level.toLowerCase();
                                  return (
                                    <button
                                      key={level}
                                      type="button"
                                      onClick={() =>
                                        handleSelectReasoning(level)
                                      }
                                      className={cn(
                                        "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-all",
                                        isReasoningActive
                                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                          : "bg-muted hover:bg-muted/80 text-foreground hover:text-foreground border-border/60 border",
                                      )}
                                    >
                                      <span>{level}</span>
                                      {isReasoningActive && (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* ─── TAB: ALL or CHATS ─── */}
          {(activeTab === "all" || activeTab === "chats") && (
            <div className="space-y-1">
              <div className="text-muted-foreground/70 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider uppercase">
                {activeTab === "all"
                  ? "Recent Conversations"
                  : "All Conversations"}
              </div>

              {isSessionsLoading ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-9 w-3/4 rounded-xl" />
                  <Skeleton className="h-9 w-1/2 rounded-xl" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-muted-foreground/70 border-border/40 my-2 rounded-xl border border-dashed p-6 text-center text-xs">
                  {debouncedQuery
                    ? "No matching conversations found"
                    : "No recent conversations"}
                </div>
              ) : (
                <div
                  className="relative space-y-1 overflow-y-auto pr-1"
                  style={{
                    maxHeight: activeTab === "all" ? "240px" : "360px",
                  }}
                >
                  {sessions.map((session) => {
                    const title =
                      session.title?.trim() ||
                      session.lastMessageContent?.trim() ||
                      "New Conversation";
                    const relativeTime = formatRelativeTime(
                      session.updatedAt || session.createdAt,
                    );
                    const isCurrentSession = activeSessionId === session.id;

                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          router.push(`/chat/${session.id}`);
                        }}
                        className={cn(
                          "group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all duration-150",
                          isCurrentSession
                            ? "bg-muted text-foreground font-medium"
                            : "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <History className="text-muted-foreground/60 group-hover:text-foreground h-3.5 w-3.5 shrink-0 transition-colors" />
                          <span className="truncate text-[13px] font-medium">
                            {title}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 pl-2">
                          {relativeTime && (
                            <span className="text-muted-foreground/50 font-mono text-[10px]">
                              {relativeTime}
                            </span>
                          )}
                          <ArrowRight className="text-muted-foreground/40 group-hover:text-foreground h-3 w-3 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Monospace Shortcuts */}
        <div className="border-border/60 bg-surface/80 text-muted-foreground flex items-center justify-between border-t px-4 py-2.5 text-[11px] backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-muted rounded border border-[rgba(0,0,0,0.06)] px-1.5 py-0.5 font-mono text-[10px]">
                Tab
              </kbd>
              <span className="hidden sm:inline">switch view</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-muted rounded border border-[rgba(0,0,0,0.06)] px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>
              <span className="hidden sm:inline">select</span>
            </span>
          </div>
          <div className="text-muted-foreground/70 flex items-center gap-1 text-[10px]">
            <CommandIcon className="h-3 w-3" />
            <span>Cognito Workspace</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

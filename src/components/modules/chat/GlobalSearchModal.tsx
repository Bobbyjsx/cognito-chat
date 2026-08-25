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
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type PaletteTab = "all" | "chats" | "models" | "actions";

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
      color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    };
  }
  if (id.includes("claude")) {
    return {
      provider: "Anthropic",
      color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
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
      color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    };
  }
  if (id.includes("deepseek")) {
    return {
      provider: "DeepSeek",
      color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
    };
  }
  return {
    provider: "AI Model",
    color: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  };
}

function formatModelLabel(id: string): string {
  switch (id) {
    case "gemini-3.6-flash":
      return "Gemini 3.6 Flash";
    case "gemini-2.5-pro":
      return "Gemini 2.5 Pro";
    case "gpt-4o":
      return "GPT-4o";
    case "claude-3-5-sonnet":
      return "Claude 3.5 Sonnet";
    case "deepseek-r1":
      return "DeepSeek R1";
    default:
      return id
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
}

export function GlobalSearchModal({
  open,
  onOpenChange,
  activeSessionId,
  activeModel = "gemini-3.6-flash",
  onSelectModel,
  activeReasoning = "medium",
  onSelectReasoning,
  onNewChat,
}: GlobalSearchModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<PaletteTab>("all");
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  const inputRef = React.useRef<HTMLInputElement>(null);
  const virtualListRef = React.useRef<HTMLDivElement>(null);

  const { data: config } = useGetConfig();

  // Reset state when opening modal
  React.useEffect(() => {
    if (open) {
      setSearchInput("");
      setDebouncedQuery("");
      setActiveTab("all");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

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
    return (
      sessionsData?.pages
        .flatMap((page) => page?.items || [])
        .filter((session): session is ChatSessionListItem =>
          Boolean(session),
        ) || []
    );
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
          id: "gemini-2.5-pro",
          name: "Gemini 2.5 Pro",
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

    return Object.entries(rawList)
      .filter(([, cfg]) => cfg.enabled)
      .map(([id, cfg]) => ({
        id,
        name: formatModelLabel(id),
        description: cfg.description || "General intelligence model",
        reasoningModes: cfg.reasoningModes || ["low", "medium", "high"],
      }));
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

  // Handle Model Selection
  const handleSelectModel = React.useCallback(
    (modelId: string) => {
      onOpenChange(false);

      // Save to localStorage
      const storageKey = activeSessionId
        ? `chat_settings_${activeSessionId}`
        : "chat_settings_default";
      try {
        const saved = localStorage.getItem(storageKey);
        const data = saved ? JSON.parse(saved) : {};
        localStorage.setItem(
          storageKey,
          JSON.stringify({ ...data, model: modelId }),
        );
      } catch {}

      if (onSelectModel) {
        onSelectModel(modelId);
      }
      toast.success(`Switched active model to ${formatModelLabel(modelId)}`);
    },
    [activeSessionId, onOpenChange, onSelectModel],
  );

  // Handle Reasoning Selection
  const handleSelectReasoning = React.useCallback(
    (level: string) => {
      onOpenChange(false);

      const storageKey = activeSessionId
        ? `chat_settings_${activeSessionId}`
        : "chat_settings_default";
      try {
        const saved = localStorage.getItem(storageKey);
        const data = saved ? JSON.parse(saved) : {};
        localStorage.setItem(
          storageKey,
          JSON.stringify({ ...data, reasoning: level }),
        );
      } catch {}

      if (onSelectReasoning) {
        onSelectReasoning(level);
      }
      toast.success(`Reasoning depth set to ${level}`);
    },
    [activeSessionId, onOpenChange, onSelectReasoning],
  );

  // Virtualizer for conversations list
  const sessionRowVirtualizer = useVirtualizer({
    count: sessions.length,
    getScrollElement: () => virtualListRef.current,
    estimateSize: () => 48,
    overscan: 8,
  });

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const tabs: PaletteTab[] = ["all", "chats", "models", "actions"];
      const nextIdx =
        (tabs.indexOf(activeTab) + (e.shiftKey ? -1 : 1) + tabs.length) %
        tabs.length;
      setActiveTab(tabs[nextIdx]);
    }
  };

  const tabs: { id: PaletteTab; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    { id: "chats", label: "Conversations", count: sessions.length },
    {
      id: "models",
      label: "Models & Reasoning",
      count: availableModels.length,
    },
    { id: "actions", label: "Actions", count: actions.length },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[18%] w-full max-w-[620px] translate-y-0 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white p-0 shadow-2xl dark:bg-[#18181b]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Workspace Command Palette</DialogTitle>
          <DialogDescription>
            Search conversations, switch AI models, control reasoning, and
            execute actions.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="border-border/60 flex items-center gap-3 border-b px-4 py-3.5">
          <Search className="text-muted-foreground h-4 w-4 shrink-0" />
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
                    : "Type a command, model name, or search chats..."
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-foreground placeholder:text-muted-foreground/60 w-full bg-transparent text-[14px] font-normal outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="text-muted-foreground hover:text-foreground rounded p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Tab Switcher Header */}
        <div className="border-border/50 bg-surface/50 flex items-center gap-1 border-b px-3 py-1.5 backdrop-blur-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                  isActive
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <span>{tab.label}</span>
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
        <div className="max-h-[380px] min-h-[220px] overflow-y-auto p-2">
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
                      <div className="flex items-center gap-2.5">
                        <div className="bg-surface-container-high/80 text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.06)]">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-foreground text-[13px] font-medium">
                            {action.title}
                          </div>
                          <div className="text-muted-foreground text-[11px]">
                            {action.description}
                          </div>
                        </div>
                      </div>
                      {action.shortcut && (
                        <kbd className="bg-muted text-muted-foreground rounded border border-[rgba(0,0,0,0.06)] px-1.5 py-0.5 font-mono text-[10px]">
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
                  <span>AI Models & Reasoning</span>
                  <span className="text-muted-foreground/60 font-sans text-[10px] normal-case">
                    Click to switch model
                  </span>
                </div>
                <div className="space-y-1.5">
                  {filteredModels.map((m) => {
                    const isCurrent = activeModel === m.id;
                    const provider = getProviderInfo(m.id);

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "group rounded-xl border p-2.5 transition-all",
                          isCurrent
                            ? "border-primary/30 bg-primary/5 shadow-xs"
                            : "border-border/50 hover:bg-muted/40 hover:border-border",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectModel(m.id)}
                            className="flex flex-1 items-start gap-2.5 text-left"
                          >
                            <div className="bg-surface-container-high/60 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.06)]">
                              <Cpu className="text-foreground h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
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
                                {isCurrent && (
                                  <span className="bg-primary text-primary-foreground py-0.2 flex items-center gap-1 rounded-full px-1.5 font-mono text-[9px] font-semibold tracking-wide uppercase">
                                    <Check className="h-2.5 w-2.5" />
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
                                {m.description}
                              </p>
                            </div>
                          </button>
                        </div>

                        {/* Inline Reasoning Levels if selected model */}
                        {isCurrent && m.reasoningModes.length > 0 && (
                          <div className="mt-2.5 flex items-center gap-1.5 border-t border-[rgba(0,0,0,0.06)] pt-2 pl-9">
                            <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium">
                              <Brain className="h-3 w-3" />
                              Reasoning:
                            </span>
                            {m.reasoningModes.map((level) => {
                              const isReasoningActive =
                                activeReasoning.toLowerCase() ===
                                level.toLowerCase();
                              return (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => handleSelectReasoning(level)}
                                  className={cn(
                                    "rounded-md px-2 py-0.5 text-[10px] font-medium capitalize transition-all",
                                    isReasoningActive
                                      ? "bg-foreground text-background font-semibold shadow-xs"
                                      : "bg-muted/80 text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  {level}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* ─── TAB: ALL or CHATS (Virtualized) ─── */}
          {(activeTab === "all" || activeTab === "chats") && (
            <div className="space-y-1">
              <div className="text-muted-foreground/70 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider uppercase">
                {activeTab === "all"
                  ? "Recent Conversations"
                  : "All Conversations"}
              </div>

              {isSessionsLoading ? (
                <div className="space-y-2 p-3">
                  <div className="bg-muted/60 h-8 w-3/4 animate-pulse rounded-lg" />
                  <div className="bg-muted/40 h-8 w-1/2 animate-pulse rounded-lg" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-muted-foreground/70 border-border/40 my-2 rounded-xl border border-dashed p-6 text-center text-xs">
                  {debouncedQuery
                    ? "No matching conversations found"
                    : "No recent conversations"}
                </div>
              ) : (
                <div
                  ref={virtualListRef}
                  className="relative overflow-y-auto pr-1"
                  style={{
                    maxHeight: activeTab === "all" ? "220px" : "320px",
                    minHeight: "100px",
                  }}
                >
                  <div
                    className="relative w-full"
                    style={{
                      height: `${sessionRowVirtualizer.getTotalSize()}px`,
                    }}
                  >
                    {sessionRowVirtualizer
                      .getVirtualItems()
                      .map((virtualItem) => {
                        const session = sessions[virtualItem.index];
                        const title =
                          session.title?.trim() ||
                          session.lastMessageContent?.trim() ||
                          "New Conversation";
                        const relativeTime = formatRelativeTime(
                          session.updatedAt || session.createdAt,
                        );
                        const isCurrentSession = activeSessionId === session.id;

                        return (
                          <div
                            key={session.id}
                            className="absolute top-0 left-0 w-full px-0.5 py-0.5"
                            style={{
                              height: `${virtualItem.size}px`,
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onOpenChange(false);
                                router.push(`/chat/${session.id}`);
                              }}
                              className={cn(
                                "group flex h-full w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all duration-150",
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
                          </div>
                        );
                      })}
                  </div>
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
              <span>switch view</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-muted rounded border border-[rgba(0,0,0,0.06)] px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>
              <span>select</span>
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

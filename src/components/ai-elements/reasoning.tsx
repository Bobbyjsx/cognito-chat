"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import type { BundledLanguage } from "shiki";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import dynamic from "next/dynamic";

const StreamdownWrapper = dynamic(() => import("./streamdown-wrapper"), {
  ssr: false,
});

import { Shimmer } from "./shimmer";

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number | undefined;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const MS_IN_S = 1000;

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const resolvedDefaultOpen = defaultOpen ?? isStreaming;
    // Track if defaultOpen was explicitly set to false (to prevent auto-open)
    const isExplicitlyClosed = defaultOpen === false;

    const [isOpen, setIsOpen] = useControllableState<boolean>({
      defaultProp: resolvedDefaultOpen,
      onChange: onOpenChange,
      prop: open,
    });
    const [duration, setDuration] = useControllableState<number | undefined>({
      defaultProp: undefined,
      prop: durationProp,
    });

    const hasEverStreamedRef = useRef(isStreaming);
    const startTimeRef = useRef<number | null>(null);

    // Track when streaming starts and compute duration
    useEffect(() => {
      if (isStreaming) {
        hasEverStreamedRef.current = true;
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now();
        }
      } else if (startTimeRef.current !== null) {
        setDuration(Math.ceil((Date.now() - startTimeRef.current) / MS_IN_S));
        startTimeRef.current = null;
      }
    }, [isStreaming, setDuration]);

    // Auto-open when streaming starts (unless explicitly closed)
    useEffect(() => {
      if (isStreaming && !isOpen && !isExplicitlyClosed) {
        setIsOpen(true);
      }
    }, [isStreaming, isOpen, setIsOpen, isExplicitlyClosed]);

    // Keep reasoning accordion open after streaming ends to prevent jarring page layout jumps.

    const handleOpenChange = useCallback(
      (newOpen: boolean) => {
        setIsOpen(newOpen);
      },
      [setIsOpen],
    );

    const contextValue = useMemo(
      () => ({ duration, isOpen, isStreaming, setIsOpen }),
      [duration, isOpen, isStreaming, setIsOpen],
    );

    return (
      <ReasoningContext.Provider value={contextValue}>
        <Collapsible
          className={cn("not-prose mb-4", className)}
          onOpenChange={handleOpenChange}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    );
  },
);

export type ReasoningTriggerProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};

const defaultGetThinkingMessage = (isStreaming: boolean, duration?: number) => {
  if (isStreaming || duration === 0) {
    return <Shimmer duration={1}>Thinking...</Shimmer>;
  }
  if (duration === undefined) {
    return <p>Thought for a few seconds</p>;
  }
  return <p>Thought for {duration} seconds</p>;
};

export const ReasoningTrigger = memo(
  ({
    className,
    children,
    getThinkingMessage = defaultGetThinkingMessage,
    ...props
  }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning();

    return (
      <CollapsibleTrigger
        className={cn(
          "text-muted-foreground hover:text-foreground flex w-full items-center gap-2 text-sm transition-colors",
          className,
        )}
        {...props}
      >
        {children ?? (
          <>
            <BrainIcon className="size-4" />
            {getThinkingMessage(isStreaming, duration)}
            <ChevronDownIcon
              className={cn(
                "size-4 transition-transform",
                isOpen ? "rotate-180" : "rotate-0",
              )}
            />
          </>
        )}
      </CollapsibleTrigger>
    );
  },
);

export type ReasoningContentProps = ComponentProps<
  typeof CollapsibleContent
> & {
  children: string;
};

// Dynamic import for CodeBlock components to avoid shiki in Edge Worker
const CodeBlock = dynamic(
  () => import("./code-block").then((m) => m.CodeBlock),
  { ssr: false },
);
const CodeBlockActions = dynamic(
  () => import("./code-block").then((m) => m.CodeBlockActions),
  { ssr: false },
);
const CodeBlockCopyButton = dynamic(
  () => import("./code-block").then((m) => m.CodeBlockCopyButton),
  { ssr: false },
);
const CodeBlockHeader = dynamic(
  () => import("./code-block").then((m) => m.CodeBlockHeader),
  { ssr: false },
);
const CodeBlockTitle = dynamic(
  () => import("./code-block").then((m) => m.CodeBlockTitle),
  { ssr: false },
);

const streamdownComponents = {
  code({ className, children, ...props }: ComponentProps<"code">) {
    const match = /language-(\w+)/.exec((className as string) || "");
    const rawText = String(children || "").replace(/\n$/, "");
    const isMultiLine = rawText.includes("\n") || Boolean(match);

    if (isMultiLine) {
      const language = (match ? match[1] : "") as BundledLanguage;
      return (
        <div className="my-3 overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#1e1e1e] shadow-md">
          <CodeBlock
            code={rawText}
            language={language || ("text" as BundledLanguage)}
          >
            <CodeBlockHeader className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[#252526] px-3.5 py-1.5 font-mono text-xs text-gray-300">
              <CodeBlockTitle>
                <span className="font-mono text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                  {language || "code"}
                </span>
              </CodeBlockTitle>
              <CodeBlockActions>
                <CodeBlockCopyButton className="h-7 px-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white" />
              </CodeBlockActions>
            </CodeBlockHeader>
          </CodeBlock>
        </div>
      );
    }

    return (
      <code
        className={cn(
          "bg-surface-container-high/80 font-code-sm text-on-surface rounded border border-[rgba(0,0,0,0.06)] px-1.5 py-0.5 text-[13px] font-medium",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
};

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => (
    <CollapsibleContent
      className={cn(
        "mt-4 text-sm",
        "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-muted-foreground data-[state=closed]:animate-out data-[state=open]:animate-in outline-none",
        className,
      )}
      {...props}
    >
      <StreamdownWrapper components={streamdownComponents}>
        {children}
      </StreamdownWrapper>
    </CollapsibleContent>
  ),
);

Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";

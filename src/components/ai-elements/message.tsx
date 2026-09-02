"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PanelRightOpen,
  ExternalLink,
} from "lucide-react";
import { useArtifactStore } from "@/hooks/useArtifactStore";
import type { ComponentProps, HTMLAttributes, ReactElement } from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import dynamic from "next/dynamic";
import type { Streamdown } from "streamdown";
import type { BundledLanguage } from "shiki";
import StreamdownWrapper from "./streamdown-wrapper";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className,
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "is-user:dark flex w-fit max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm",
      "group-[.is-user]:bg-secondary group-[.is-user]:text-foreground group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:px-4 group-[.is-user]:py-3",
      "group-[.is-assistant]:text-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionsProps = ComponentProps<"div">;

export const MessageActions = ({
  className,
  children,
  ...props
}: MessageActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type="button" variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={button} />
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

interface MessageBranchContextType {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(
  null,
);

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext);

  if (!context) {
    throw new Error(
      "MessageBranch components must be used within MessageBranch",
    );
  }

  return context;
};

export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<ReactElement[]>([]);

  const handleBranchChange = useCallback(
    (newBranch: number) => {
      setCurrentBranch(newBranch);
      onBranchChange?.(newBranch);
    },
    [onBranchChange],
  );

  const goToPrevious = useCallback(() => {
    const newBranch =
      currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const goToNext = useCallback(() => {
    const newBranch =
      currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const contextValue = useMemo<MessageBranchContextType>(
    () => ({
      branches,
      currentBranch,
      goToNext,
      goToPrevious,
      setBranches,
      totalBranches: branches.length,
    }),
    [branches, currentBranch, goToNext, goToPrevious],
  );

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div
        className={cn("grid w-full gap-2 [&>div]:pb-0", className)}
        {...props}
      />
    </MessageBranchContext.Provider>
  );
};

export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageBranchContent = ({
  children,
  ...props
}: MessageBranchContentProps) => {
  const { currentBranch, setBranches, branches } = useMessageBranch();
  const childrenArray = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children],
  );

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return childrenArray.map((branch, index) => (
    <div
      className={cn(
        "grid gap-2 overflow-hidden [&>div]:pb-0",
        index === currentBranch ? "block" : "hidden",
      )}
      key={branch.key}
      {...props}
    >
      {branch}
    </div>
  ));
};

export type MessageBranchSelectorProps = ComponentProps<typeof ButtonGroup>;

export const MessageBranchSelector = ({
  className,
  ...props
}: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      className={cn(
        "[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md",
        className,
      )}
      orientation="horizontal"
      {...props}
    />
  );
};

export type MessageBranchPreviousProps = ComponentProps<typeof Button>;

export const MessageBranchPrevious = ({
  children,
  ...props
}: MessageBranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
};

export type MessageBranchNextProps = ComponentProps<typeof Button>;

export const MessageBranchNext = ({
  children,
  ...props
}: MessageBranchNextProps) => {
  const { goToNext, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
};

export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>;

export const MessageBranchPage = ({
  className,
  ...props
}: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch();

  return (
    <ButtonGroupText
      className={cn(
        "text-muted-foreground border-none bg-transparent shadow-none",
        className,
      )}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  );
};

export type MessageResponseProps = ComponentProps<typeof Streamdown>;

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockContent,
} from "./code-block";

const MermaidDiagram = dynamic(
  () => import("./mermaid-diagram").then((m) => m.MermaidDiagram),
  { ssr: false },
);

function CodeBlockOpenCanvasButton({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const { openArtifact } = useArtifactStore();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1.5 rounded-md px-2 text-[11px] font-medium text-[#a6adc8] transition-colors hover:bg-[#313244] hover:text-[#cdd6f4]"
      onClick={() =>
        openArtifact({
          id: `art-${Date.now()}`,
          title: `${(language || "Code").toUpperCase()} Artifact`,
          language: language || "text",
          content: code,
          type: "code",
        })
      }
      title="Open in Canvas"
      aria-label="Open in Canvas"
    >
      <PanelRightOpen className="h-3.5 w-3.5" />
      <span>Open in Canvas</span>
    </Button>
  );
}

const streamdownComponents = {
  code({ className, children, ...props }: ComponentProps<"code">) {
    const match = /language-(\w+)/.exec((className as string) || "");
    const rawText = String(children || "").replace(/\n$/, "");
    const isMultiLine = rawText.includes("\n") || Boolean(match);

    if (isMultiLine) {
      const language = (match ? match[1] : "") as BundledLanguage;

      return (
        <div className="my-3 overflow-hidden rounded-xl border border-[#313244] bg-[#1e1e2e] shadow-lg">
          <CodeBlock
            code={rawText}
            language={language || ("text" as BundledLanguage)}
          >
            <CodeBlockHeader className="flex items-center justify-between border-b border-[#313244] bg-[#181825] px-3 py-1.5 font-mono text-xs text-[#cdd6f4]">
              <CodeBlockTitle>
                <span className="rounded bg-[#313244] px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#a6adc8] uppercase">
                  {language || "code"}
                </span>
              </CodeBlockTitle>
              <CodeBlockActions className="flex items-center gap-1">
                <CodeBlockOpenCanvasButton
                  code={rawText}
                  language={language || "code"}
                />
                <CodeBlockCopyButton className="h-7 px-2 text-xs text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4]" />
              </CodeBlockActions>
            </CodeBlockHeader>
            {language === "mermaid" ? (
              <MermaidDiagram code={rawText} />
            ) : (
              <CodeBlockContent
                code={rawText}
                language={language || ("text" as BundledLanguage)}
              />
            )}
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

  a({ href, children, className, ...props }: ComponentProps<"a">) {
    const isExternal =
      typeof href === "string" &&
      (href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//"));
    const textContent = typeof children === "string" ? children.trim() : "";
    const isCitationBadge =
      /^(?:\[\^?\d+\]|\^?\d+|\d+)$/.test(textContent) ||
      (props as Record<string, unknown>)["data-footnote-ref"] !== undefined;

    if (isCitationBadge) {
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className={cn(
            "text-primary bg-primary/10 hover:bg-primary/20 py-0.2 mx-0.5 inline-flex items-center justify-center rounded-md px-1 align-super font-mono text-[10px] font-semibold no-underline transition-colors",
            className,
          )}
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={cn(
          "text-primary decoration-primary/40 hover:decoration-primary inline-flex items-center gap-0.5 font-medium underline underline-offset-4 transition-colors",
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        {isExternal && (
          <ExternalLink className="ml-0.5 inline h-3 w-3 shrink-0 opacity-70" />
        )}
      </a>
    );
  },

  sup({ className, children, ...props }: ComponentProps<"sup">) {
    return (
      <sup
        className={cn(
          "text-primary ml-0.5 align-super font-mono text-[11px] leading-none font-semibold",
          className,
        )}
        {...props}
      >
        {children}
      </sup>
    );
  },

  section({ className, children, ...props }: ComponentProps<"section">) {
    const isFootnotes =
      (props as Record<string, unknown>)["data-footnotes"] !== undefined ||
      className?.includes("footnotes");

    if (isFootnotes) {
      return (
        <section
          className={cn(
            "border-border/60 text-muted-foreground mt-6 space-y-2 border-t pt-4 text-xs [&_li]:mt-1.5 [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:pl-4",
            className,
          )}
          {...props}
        >
          <div className="text-foreground mb-2 text-[11px] font-semibold tracking-wider uppercase">
            References & Sources
          </div>
          {children}
        </section>
      );
    }

    return (
      <section className={className} {...props}>
        {children}
      </section>
    );
  },

  table({ className, children, ...props }: ComponentProps<"table">) {
    return (
      <div className="border-border/60 bg-surface/50 my-3 overflow-x-auto rounded-xl border">
        <table
          className={cn("w-full border-collapse text-left text-xs", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },

  th({ className, children, ...props }: ComponentProps<"th">) {
    return (
      <th
        className={cn(
          "border-border/60 bg-muted/60 text-foreground border-b px-3 py-2 font-semibold",
          className,
        )}
        {...props}
      >
        {children}
      </th>
    );
  },

  td({ className, children, ...props }: ComponentProps<"td">) {
    return (
      <td
        className={cn(
          "border-border/40 text-foreground/90 border-b px-3 py-2 last:border-b-0",
          className,
        )}
        {...props}
      >
        {children}
      </td>
    );
  },
};

export const MessageResponse = memo(
  ({ className, ...props }: MessageResponseProps) => (
    <StreamdownWrapper
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      components={streamdownComponents}
      {...props}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    nextProps.isAnimating === prevProps.isAnimating,
);

MessageResponse.displayName = "MessageResponse";

export type MessageToolbarProps = ComponentProps<"div">;

export const MessageToolbar = ({
  className,
  children,
  ...props
}: MessageToolbarProps) => (
  <div
    className={cn(
      "mt-4 flex w-full items-center justify-between gap-4",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

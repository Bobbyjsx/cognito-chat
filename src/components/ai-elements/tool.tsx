"use client";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  GlobeIcon,
  TerminalIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  useEffect,
  isValidElement,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { CodeBlock } from "./code-block";
import { Shimmer } from "./shimmer";

export type ToolProps = ComponentProps<typeof Collapsible> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const Tool = ({
  className,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: ToolProps) => {
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  });

  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
    }
  }, [defaultOpen, setOpen]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("group not-prose mb-4 w-full rounded-md border", className)}
      {...props}
    />
  );
};

export type ToolPart = ToolUIPart | DynamicToolUIPart;

export interface SourceItem {
  title: string;
  url: string;
  domain: string;
  faviconUrl: string;
}

export function isSearchTool(name?: string): boolean {
  if (!name) return false;
  const norm = name.toLowerCase().replace(/[:\-_]/g, "");
  return (
    norm === "googlesearch" ||
    norm === "websearch" ||
    norm === "search" ||
    name === "google:search" ||
    name === "google_search"
  );
}

export function isCodeTool(name?: string): boolean {
  if (!name) return false;
  const norm = name.toLowerCase().replace(/[:\-_]/g, "");
  return (
    norm === "codeexecution" ||
    norm === "pythonexecution" ||
    name === "code_execution"
  );
}

export function extractSearchData(part: ToolPart): {
  query: string;
  queries: string[];
  sources: SourceItem[];
} {
  let query = "";
  let queries: string[] = [];
  const rawSources: Array<{ title?: string; uri?: string; url?: string }> = [];

  // Extract from input
  if ("input" in part && part.input && typeof part.input === "object") {
    const input = part.input as Record<string, unknown>;
    if (typeof input.query === "string" && input.query.trim()) {
      query = input.query.trim();
    }
    if (Array.isArray(input.queries)) {
      queries = input.queries.filter(
        (q): q is string => typeof q === "string" && Boolean(q.trim()),
      );
      if (!query && queries.length > 0) {
        query = queries[0];
      }
    }
  }

  // Extract from output
  if ("output" in part && part.output && typeof part.output === "object") {
    const output = part.output as Record<string, unknown>;
    if (!query && typeof output.query === "string" && output.query.trim()) {
      query = output.query.trim();
    }
    if (Array.isArray(output.queries)) {
      const outQueries = output.queries.filter(
        (q): q is string => typeof q === "string" && Boolean(q.trim()),
      );
      if (outQueries.length > 0) {
        queries = Array.from(new Set([...queries, ...outQueries]));
        if (!query) query = queries[0];
      }
    }
    if (Array.isArray(output.sources)) {
      rawSources.push(
        ...(output.sources as Array<{
          title?: string;
          uri?: string;
          url?: string;
        }>),
      );
    }
  }

  const seen = new Set<string>();
  const sources: SourceItem[] = [];

  for (const src of rawSources) {
    const url = src.uri || src.url || "";
    if (!url || seen.has(url)) continue;
    seen.add(url);

    let domain = "";
    try {
      const parsed = new URL(url);
      if (
        !parsed.hostname.includes("grounding-api-redirect") &&
        !parsed.hostname.includes("vertexaisearch")
      ) {
        domain = parsed.hostname.replace(/^www\./, "");
      }
    } catch {
      // ignore URL parsing error
    }

    if (
      !domain &&
      src.title &&
      src.title.includes(".") &&
      !src.title.includes(" ")
    ) {
      domain = src.title.replace(/^https?:\/\//, "").replace(/^www\./, "");
    }

    const title = src.title || domain || "Web Source";
    const finalDomain = domain || title;
    const faviconHost = domain || (title.includes(".") ? title : "google.com");
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      faviconHost,
    )}&sz=32`;

    sources.push({
      title,
      url,
      domain: finalDomain,
      faviconUrl,
    });
  }

  return { query, queries, sources };
}

export function SourceBubble({ source }: { source: SourceItem }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group/source border-border/70 inline-flex items-center gap-1.5 rounded-full border",
              "bg-surface-container-low/60 hover:bg-surface-container-high/90 dark:bg-muted/40 dark:hover:bg-muted/70",
              "text-foreground/80 hover:text-foreground px-2.5 py-1 text-xs font-medium",
              "max-w-[210px] shrink-0 cursor-pointer transition-all duration-150 select-none",
              "hover:border-border hover:shadow-xs",
            )}
          />
        }
      >
        <span className="bg-background border-border/40 relative flex h-3.5 w-3.5 shrink-0 items-center justify-center overflow-hidden rounded-full border">
          {!imgFailed ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={source.faviconUrl}
              alt=""
              className="h-3 w-3 object-contain"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <GlobeIcon className="text-muted-foreground size-2.5" />
          )}
        </span>
        <span className="truncate">{source.domain}</span>
        <ExternalLinkIcon className="text-muted-foreground/50 size-2.5 shrink-0 opacity-0 transition-opacity group-hover/source:opacity-100" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs space-y-1 p-2 text-xs">
        <p className="text-foreground line-clamp-2 font-semibold">
          {source.title}
        </p>
        <p className="text-muted-foreground truncate text-[11px]">
          {source.url}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function SourceBubbles({
  sources,
  className,
}: {
  sources: SourceItem[];
  className?: string;
}) {
  if (!sources || sources.length === 0) return null;

  return (
    <div
      className={cn(
        "border-border/40 animate-in fade-in mt-3.5 space-y-2 border-t pt-3 duration-300",
        className,
      )}
    >
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <GlobeIcon className="size-3.5" />
        <span>Sources</span>
        <span className="text-muted-foreground/60 text-[11px]">
          ({sources.length})
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {sources.map((source, index) => (
          <SourceBubble key={`${source.url}-${index}`} source={source} />
        ))}
      </div>
    </div>
  );
}

export function WebSearchToolView({ part }: { part: ToolPart }) {
  const { query, queries, sources } = extractSearchData(part);
  const isRunning =
    part.state === "input-streaming" ||
    part.state === "input-available" ||
    (part as { state: string }).state === "call";
  const isError = part.state === "output-error";
  const [open, setOpen] = useState(false);

  if (isRunning) {
    return (
      <div className="border-border/60 bg-muted/30 text-muted-foreground animate-in fade-in my-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs duration-200">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="bg-primary/60 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
          <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
        </span>
        <GlobeIcon className="text-primary size-3.5 shrink-0" />
        <Shimmer className="text-xs">
          Searching the web for{" "}
          <span className="text-foreground font-semibold">
            “{query || "information"}”
          </span>
          ...
        </Shimmer>
      </div>
    );
  }

  const displayQuery = query || "information";

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/search not-prose my-2 w-full"
    >
      <CollapsibleTrigger
        className={cn(
          "border-border/60 flex w-full items-center justify-between gap-3 rounded-lg border",
          "bg-surface-container-low/40 hover:bg-surface-container-low/80 dark:bg-muted/20 dark:hover:bg-muted/40",
          "px-3 py-1.5 text-left text-xs transition-colors",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <GlobeIcon className="text-muted-foreground size-3.5 shrink-0" />
          <span className="text-muted-foreground truncate">
            Searched the web for{" "}
            <span className="text-foreground font-medium">
              “{displayQuery}”
            </span>
          </span>
          {sources.length > 0 && (
            <Badge
              variant="secondary"
              className="border-border/40 h-4 shrink-0 rounded-full border px-1.5 text-[10px] font-normal"
            >
              {sources.length} {sources.length === 1 ? "source" : "sources"}
            </Badge>
          )}
          {isError && (
            <Badge
              variant="destructive"
              className="h-4 shrink-0 rounded-full px-1.5 text-[10px]"
            >
              Error
            </Badge>
          )}
        </div>
        <ChevronDownIcon className="text-muted-foreground size-3.5 shrink-0 transition-transform group-data-[state=open]/search:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border/40 bg-surface-container-lowest/50 dark:bg-muted/10 mt-1.5 space-y-2.5 rounded-lg border p-3 text-xs">
        {queries.length > 0 && (
          <div className="space-y-1">
            <h5 className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Queries Searched
            </h5>
            <div className="flex flex-wrap gap-1">
              {queries.map((q, i) => (
                <span
                  key={i}
                  className="border-border/40 bg-muted/50 text-foreground rounded-md border px-2 py-0.5 font-mono text-[11px]"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}
        {sources.length > 0 && (
          <div className="space-y-1 pt-1">
            <h5 className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Sources ({sources.length})
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s, i) => (
                <SourceBubble key={`${s.url}-${i}`} source={s} />
              ))}
            </div>
          </div>
        )}
        {"errorText" in part && part.errorText && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-md border p-2">
            {part.errorText}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function CodeExecutionToolView({ part }: { part: ToolPart }) {
  const isRunning =
    part.state === "input-streaming" ||
    part.state === "input-available" ||
    (part as { state: string }).state === "call";
  const isError = part.state === "output-error";
  const [open, setOpen] = useState(false);

  const input = (
    "input" in part && part.input && typeof part.input === "object"
      ? part.input
      : {}
  ) as Record<string, unknown>;
  const output = (
    "output" in part && part.output && typeof part.output === "object"
      ? part.output
      : {}
  ) as Record<string, unknown>;
  const code = typeof input.code === "string" ? input.code : "";
  const resultOutput = typeof output.output === "string" ? output.output : "";
  const errorText =
    ("errorText" in part ? part.errorText : "") ||
    (output.error ? String(output.error) : "");

  if (isRunning) {
    return (
      <div className="border-border/60 bg-muted/30 text-muted-foreground animate-in fade-in my-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs duration-200">
        <TerminalIcon className="size-3.5 shrink-0 animate-pulse text-emerald-500" />
        <Shimmer className="text-xs">Executing Python code...</Shimmer>
      </div>
    );
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/code not-prose my-2 w-full"
    >
      <CollapsibleTrigger
        className={cn(
          "border-border/60 flex w-full items-center justify-between gap-3 rounded-lg border",
          "bg-surface-container-low/40 hover:bg-surface-container-low/80 dark:bg-muted/20 dark:hover:bg-muted/40",
          "px-3 py-1.5 text-left text-xs transition-colors",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <TerminalIcon className="size-3.5 shrink-0 text-emerald-600" />
          <span className="text-foreground font-medium">Executed Python</span>
          {isError ? (
            <Badge
              variant="destructive"
              className="h-4 shrink-0 rounded-full px-1.5 text-[10px]"
            >
              Error
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="h-4 shrink-0 rounded-full px-1.5 text-[10px] font-normal"
            >
              Success
            </Badge>
          )}
        </div>
        <ChevronDownIcon className="text-muted-foreground size-3.5 shrink-0 transition-transform group-data-[state=open]/code:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border/40 bg-surface-container-lowest/50 dark:bg-muted/10 mt-1.5 space-y-2.5 rounded-lg border p-3 text-xs">
        {code && (
          <div className="space-y-1">
            <h5 className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Python Script
            </h5>
            <div className="border-border/40 overflow-hidden rounded-md border">
              <CodeBlock code={code} language="python" />
            </div>
          </div>
        )}
        {resultOutput && (
          <div className="space-y-1">
            <h5 className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Terminal Output
            </h5>
            <div className="overflow-x-auto rounded-md bg-neutral-950 p-3 font-mono text-xs whitespace-pre text-emerald-400">
              {resultOutput}
            </div>
          </div>
        )}
        {errorText && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-md border p-2 font-mono text-xs">
            {errorText}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export type ToolHeaderProps = {
  title?: string;
  className?: string;
} & (
  | { type: ToolUIPart["type"]; state: ToolUIPart["state"]; toolName?: never }
  | {
      type: DynamicToolUIPart["type"];
      state: DynamicToolUIPart["state"];
      toolName: string;
    }
);

const statusLabels: Record<ToolPart["state"], string> = {
  "approval-requested": "Awaiting Approval",
  "approval-responded": "Responded",
  "input-available": "Running",
  "input-streaming": "Pending",
  "output-available": "Completed",
  "output-denied": "Denied",
  "output-error": "Error",
};

const statusIcons: Record<ToolPart["state"], ReactNode> = {
  "approval-requested": <ClockIcon className="size-4 text-yellow-600" />,
  "approval-responded": <CheckCircleIcon className="size-4 text-blue-600" />,
  "input-available": <ClockIcon className="size-4 animate-pulse" />,
  "input-streaming": <CircleIcon className="size-4" />,
  "output-available": <CheckCircleIcon className="size-4 text-green-600" />,
  "output-denied": <XCircleIcon className="size-4 text-orange-600" />,
  "output-error": <XCircleIcon className="size-4 text-red-600" />,
};

export const getStatusBadge = (status: ToolPart["state"]) => (
  <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
    {statusIcons[status]}
    {statusLabels[status]}
  </Badge>
);

export const ToolHeader = ({
  className,
  title,
  type,
  state,
  toolName,
  ...props
}: ToolHeaderProps) => {
  const derivedName =
    type === "dynamic-tool" ? toolName : type.split("-").slice(1).join("-");

  return (
    <CollapsibleTrigger
      className={cn(
        "flex w-full items-center justify-between gap-4 p-3",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <WrenchIcon className="text-muted-foreground size-4" />
        <span className="text-sm font-medium">{title ?? derivedName}</span>
        {getStatusBadge(state)}
      </div>
      <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
};

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 outline-none",
      className,
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn("space-y-2 overflow-hidden", className)} {...props}>
    <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
      Parameters
    </h4>
    <div className="bg-muted/50 rounded-md">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ToolPart["output"];
  errorText: ToolPart["errorText"];
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  // If output contains sources array, render as source bubbles instead of raw JSON
  if (
    output &&
    typeof output === "object" &&
    "sources" in (output as Record<string, unknown>) &&
    Array.isArray((output as Record<string, unknown>).sources)
  ) {
    const fakePart = {
      type: "dynamic-tool",
      state: "output-available",
      toolName: "search",
      output,
    } as unknown as ToolPart;
    const { sources } = extractSearchData(fakePart);
    if (sources.length > 0) {
      return (
        <div className={cn("space-y-2", className)} {...props}>
          <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Sources
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {sources.map((s, i) => (
              <SourceBubble key={`${s.url}-${i}`} source={s} />
            ))}
          </div>
        </div>
      );
    }
  }

  let Output = <div>{output as ReactNode}</div>;

  if (typeof output === "object" && !isValidElement(output)) {
    Output = (
      <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />
    );
  } else if (typeof output === "string") {
    Output = <CodeBlock code={output} language="json" />;
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {errorText ? "Error" : "Result"}
      </h4>
      <div
        className={cn(
          "overflow-x-auto rounded-md text-xs [&_table]:w-full",
          errorText
            ? "bg-destructive/10 text-destructive"
            : "bg-muted/50 text-foreground",
        )}
      >
        {errorText && <div>{errorText}</div>}
        {Output}
      </div>
    </div>
  );
};

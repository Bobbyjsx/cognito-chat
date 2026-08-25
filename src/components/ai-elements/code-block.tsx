"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps, CSSProperties, HTMLAttributes } from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  BundledLanguage,
  BundledTheme,
  HighlighterGeneric,
  ThemedToken,
} from "shiki";

// Shiki bitflags: 1=italic, 2=bold, 4=underline
// oxlint-disable-next-line eslint(no-bitwise)
const isItalic = (fontStyle: number | undefined) => fontStyle && fontStyle & 1;
// oxlint-disable-next-line eslint(no-bitwise)
const isBold = (fontStyle: number | undefined) => fontStyle && fontStyle & 2;
const isUnderline = (fontStyle: number | undefined) =>
  // oxlint-disable-next-line eslint(no-bitwise)
  fontStyle && fontStyle & 4;

interface KeyedToken {
  token: ThemedToken;
  key: string;
}
interface KeyedLine {
  tokens: KeyedToken[];
  key: string;
}

const addKeysToTokens = (lines: ThemedToken[][]): KeyedLine[] =>
  lines.map((line, lineIdx) => ({
    key: `line-${lineIdx}`,
    tokens: line.map((token, tokenIdx) => ({
      key: `line-${lineIdx}-${tokenIdx}`,
      token,
    })),
  }));

// Token rendering component
const TokenSpan = ({ token }: { token: ThemedToken }) => (
  <span
    style={
      {
        backgroundColor: token.bgColor,
        color: token.color || "#cdd6f4",
        fontStyle: isItalic(token.fontStyle) ? "italic" : undefined,
        fontWeight: isBold(token.fontStyle) ? "bold" : undefined,
        textDecoration: isUnderline(token.fontStyle) ? "underline" : undefined,
        ...token.htmlStyle,
      } as CSSProperties
    }
  >
    {token.content}
  </span>
);

// Line rendering component with 13px font and indentation preservation on wrap
const LineSpan = ({
  keyedLine,
  showLineNumbers,
  wrap,
}: {
  keyedLine: KeyedLine;
  showLineNumbers: boolean;
  wrap?: boolean;
}) => {
  const lineContent = (
    <span
      className={cn(
        "font-mono text-[13px] leading-relaxed",
        wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre",
      )}
    >
      {keyedLine.tokens.length === 0
        ? "\n"
        : keyedLine.tokens.map(({ token, key }) => (
            <TokenSpan key={key} token={token} />
          ))}
    </span>
  );

  if (!showLineNumbers) {
    return (
      <div
        className={cn(
          "min-h-[1.45rem]",
          wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre",
        )}
      >
        {lineContent}
      </div>
    );
  }

  return (
    <div className="group/line flex min-h-[1.45rem] leading-relaxed">
      <span
        className="w-9 shrink-0 pr-3 text-right font-mono text-[13px] text-[#6c7086] select-none before:content-[counter(line)] before:[counter-increment:line]"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 pl-1">{lineContent}</div>
    </div>
  );
};

// Types
type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
  showLineNumbers?: boolean;
  wrap?: boolean;
};

interface TokenizedCode {
  tokens: ThemedToken[][];
  fg: string;
  bg: string;
}

interface CodeBlockContextType {
  code: string;
}

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

const highlighterCache = new Map<
  string,
  Promise<HighlighterGeneric<BundledLanguage, BundledTheme>>
>();

const tokensCache = new Map<string, TokenizedCode>();
const subscribers = new Map<string, Set<(result: TokenizedCode) => void>>();

const getTokensCacheKey = (code: string, language: BundledLanguage) => {
  const start = code.slice(0, 100);
  const end = code.length > 100 ? code.slice(-100) : "";
  return `${language}:${code.length}:${start}:${end}`;
};

const getHighlighter = async (
  language: BundledLanguage,
): Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> => {
  const cached = highlighterCache.get(language);
  if (cached) {
    return cached;
  }

  const { createHighlighter } = await import("shiki");

  const highlighterPromise = createHighlighter({
    langs: [language],
    themes: ["catppuccin-mocha", "github-light"],
  });

  highlighterCache.set(language, highlighterPromise);
  return highlighterPromise;
};

const createRawTokens = (code: string): TokenizedCode => ({
  bg: "#1e1e2e",
  fg: "#cdd6f4",
  tokens: code.split("\n").map((line) =>
    line === ""
      ? []
      : [
          {
            color: "#cdd6f4",
            content: line,
          } as ThemedToken,
        ],
  ),
});

export const highlightCode = (
  code: string,
  language: BundledLanguage,
  // oxlint-disable-next-line eslint-plugin-promise(prefer-await-to-callbacks)
  callback?: (result: TokenizedCode) => void,
): TokenizedCode | null => {
  const tokensCacheKey = getTokensCacheKey(code, language);

  const cached = tokensCache.get(tokensCacheKey);
  if (cached) {
    return cached;
  }

  if (callback) {
    if (!subscribers.has(tokensCacheKey)) {
      subscribers.set(tokensCacheKey, new Set());
    }
    subscribers.get(tokensCacheKey)?.add(callback);
  }

  getHighlighter(language)
    // oxlint-disable-next-line eslint-plugin-promise(prefer-await-to-then)
    .then((highlighter) => {
      const availableLangs = highlighter.getLoadedLanguages();
      const langToUse = availableLangs.includes(language) ? language : "text";

      const result = highlighter.codeToTokens(code, {
        lang: langToUse,
        theme: "catppuccin-mocha",
      });

      const tokenized: TokenizedCode = {
        bg: result.bg ?? "#1e1e2e",
        fg: result.fg ?? "#cdd6f4",
        tokens: result.tokens,
      };

      tokensCache.set(tokensCacheKey, tokenized);

      const subs = subscribers.get(tokensCacheKey);
      if (subs) {
        for (const sub of subs) {
          sub(tokenized);
        }
        subscribers.delete(tokensCacheKey);
      }
    })
    // oxlint-disable-next-line eslint-plugin-promise(prefer-await-to-then), eslint-plugin-promise(prefer-await-to-callbacks)
    .catch((error) => {
      console.error("Failed to highlight code:", error);
      subscribers.delete(tokensCacheKey);
    });

  return null;
};

const CodeBlockBody = memo(
  ({
    tokenized,
    showLineNumbers,
    wrap,
    className,
  }: {
    tokenized: TokenizedCode;
    showLineNumbers: boolean;
    wrap?: boolean;
    className?: string;
  }) => {
    const preStyle = useMemo(
      () => ({
        backgroundColor: tokenized.bg || "#1e1e2e",
        color: tokenized.fg || "#cdd6f4",
      }),
      [tokenized.bg, tokenized.fg],
    );

    const keyedLines = useMemo(
      () => addKeysToTokens(tokenized.tokens),
      [tokenized.tokens],
    );

    return (
      <pre
        className={cn(
          "code-scrollbar m-0 h-full w-full bg-[#1e1e2e] p-4 font-mono text-[13px] leading-relaxed text-[#cdd6f4]",
          "scrollbar-thin scrollbar-track-transparent overflow-x-auto overflow-y-auto",
          className,
        )}
        style={preStyle}
      >
        <code
          className={cn(
            "block min-w-full font-mono text-[13px]",
            showLineNumbers && "[counter-reset:line]",
          )}
        >
          {keyedLines.map((keyedLine) => (
            <LineSpan
              key={keyedLine.key}
              keyedLine={keyedLine}
              showLineNumbers={showLineNumbers}
              wrap={wrap}
            />
          ))}
        </code>
      </pre>
    );
  },
  (prevProps, nextProps) =>
    prevProps.tokenized === nextProps.tokenized &&
    prevProps.showLineNumbers === nextProps.showLineNumbers &&
    prevProps.wrap === nextProps.wrap &&
    prevProps.className === nextProps.className,
);

CodeBlockBody.displayName = "CodeBlockBody";

export const CodeBlockContainer = ({
  className,
  language,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { language: string }) => (
  <div
    className={cn(
      "group relative w-full overflow-hidden rounded-xl border border-[#313244] bg-[#1e1e2e] text-[#cdd6f4] shadow-lg",
      className,
    )}
    data-language={language}
    style={{
      containIntrinsicSize: "auto 200px",
      contentVisibility: "auto",
      ...style,
    }}
    {...props}
  />
);

export const CodeBlockHeader = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-between border-b border-[#313244] bg-[#181825] px-3.5 py-2 font-mono text-xs text-[#cdd6f4]",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export const CodeBlockTitle = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>
    {children}
  </div>
);

export const CodeBlockActions = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

export const CodeBlockContent = ({
  code,
  language,
  showLineNumbers = false,
  wrap = false,
  className,
}: {
  code: string;
  language: BundledLanguage;
  showLineNumbers?: boolean;
  wrap?: boolean;
  className?: string;
}) => {
  const rawTokens = useMemo(() => createRawTokens(code), [code]);

  const syncTokens = useMemo(
    () => highlightCode(code, language) ?? rawTokens,
    [code, language, rawTokens],
  );

  const [asyncTokens, setAsyncTokens] = useState<TokenizedCode | null>(null);
  const asyncKeyRef = useRef({ code, language });

  useEffect(() => {
    if (
      asyncKeyRef.current.code !== code ||
      asyncKeyRef.current.language !== language
    ) {
      asyncKeyRef.current = { code, language };
      setAsyncTokens(null);
    }
  }, [code, language]);

  useEffect(() => {
    let cancelled = false;

    highlightCode(code, language, (result) => {
      if (!cancelled) {
        setAsyncTokens(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const tokenized = asyncTokens ?? syncTokens;

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-[#1e1e2e]",
        className,
      )}
    >
      <CodeBlockBody
        showLineNumbers={showLineNumbers}
        tokenized={tokenized}
        wrap={wrap}
      />
    </div>
  );
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  wrap = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const value = useMemo(() => ({ code }), [code]);

  return (
    <CodeBlockContext.Provider value={value}>
      <CodeBlockContainer className={className} language={language} {...props}>
        {children ?? (
          <CodeBlockContent
            code={code}
            language={language}
            showLineNumbers={showLineNumbers}
            wrap={wrap}
          />
        )}
      </CodeBlockContainer>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<number>(0);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = useCallback(async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      if (!isCopied) {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        onCopy?.();
        timeoutRef.current = window.setTimeout(
          () => setIsCopied(false),
          timeout,
        );
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [code, onCopy, onError, timeout, isCopied]);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn("shrink-0 text-[#cdd6f4] hover:bg-white/10", className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};

export type CodeBlockLanguageSelectorProps = ComponentProps<typeof Select>;

export const CodeBlockLanguageSelector = (
  props: CodeBlockLanguageSelectorProps,
) => <Select {...props} />;

export type CodeBlockLanguageSelectorTriggerProps = ComponentProps<
  typeof SelectTrigger
>;

export const CodeBlockLanguageSelectorTrigger = ({
  className,
  ...props
}: CodeBlockLanguageSelectorTriggerProps) => (
  <SelectTrigger
    className={cn(
      "text-muted-foreground hover:bg-muted/50 h-7 border-none bg-transparent px-2 text-xs shadow-none focus:ring-0",
      className,
    )}
    {...props}
  />
);

export type CodeBlockLanguageSelectorValueProps = ComponentProps<
  typeof SelectValue
>;

export const CodeBlockLanguageSelectorValue = (
  props: CodeBlockLanguageSelectorValueProps,
) => <SelectValue {...props} />;

export type CodeBlockLanguageSelectorContentProps = ComponentProps<
  typeof SelectContent
>;

export const CodeBlockLanguageSelectorContent = ({
  className,
  ...props
}: CodeBlockLanguageSelectorContentProps) => (
  <SelectContent className={cn("max-h-60 min-w-32", className)} {...props} />
);

export type CodeBlockLanguageSelectorItemProps = ComponentProps<
  typeof SelectItem
>;

export const CodeBlockLanguageSelectorItem = ({
  className,
  ...props
}: CodeBlockLanguageSelectorItemProps) => (
  <SelectItem className={cn("text-xs", className)} {...props} />
);

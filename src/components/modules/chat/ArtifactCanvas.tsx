"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Code2,
  Copy,
  Check,
  Download,
  Eye,
  Maximize2,
  Minimize2,
  X,
  FileCode2,
  Sparkles,
  WrapText,
  GripVertical,
} from "lucide-react";
import { useArtifactStore } from "@/hooks/useArtifactStore";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";
import { CodeBlockContent } from "@/components/ai-elements/code-block";
import type { BundledLanguage } from "shiki";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const StreamdownWrapper = dynamic(
  () => import("@/components/ai-elements/streamdown-wrapper"),
  { ssr: false },
);

function getFileExtension(language: string): string {
  const lang = language.toLowerCase();
  switch (lang) {
    case "typescript":
    case "ts":
      return "ts";
    case "tsx":
      return "tsx";
    case "javascript":
    case "js":
      return "js";
    case "jsx":
      return "jsx";
    case "html":
      return "html";
    case "css":
      return "css";
    case "python":
    case "py":
      return "py";
    case "json":
      return "json";
    case "markdown":
    case "md":
      return "md";
    case "sql":
      return "sql";
    case "rust":
    case "rs":
      return "rs";
    case "go":
      return "go";
    default:
      return "txt";
  }
}

export function ArtifactCanvas() {
  const {
    artifact,
    isOpen,
    closeArtifact,
    activeTab,
    setActiveTab,
    isFullScreen,
    toggleFullScreen,
  } = useArtifactStore();

  const [copied, setCopied] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);
  const [panelWidth, setPanelWidth] = useState(520);
  const isResizingRef = useRef(false);

  // Resize handler for desktop side-by-side view
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const calculatedWidth = window.innerWidth - moveEvent.clientX;
      const minWidth = 360;
      const maxWidth = Math.min(window.innerWidth * 0.75, 960);
      if (calculatedWidth >= minWidth && calculatedWidth <= maxWidth) {
        setPanelWidth(calculatedWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  const isHtmlOrPreviewable = useMemo(() => {
    if (!artifact) return false;
    const lang = (artifact.language || "").toLowerCase();
    const type = artifact.type;
    return (
      type === "html" ||
      type === "svg" ||
      type === "markdown" ||
      lang === "html" ||
      lang === "svg" ||
      lang === "markdown" ||
      lang === "md"
    );
  }, [artifact]);

  const handleCopy = useCallback(async () => {
    if (!artifact?.content) return;
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [artifact]);

  const handleDownload = useCallback(() => {
    if (!artifact) return;
    try {
      const ext = getFileExtension(artifact.language);
      const filename = artifact.title
        ? artifact.title.toLowerCase().replace(/[^a-z0-9_-]/g, "-") + `.${ext}`
        : `artifact-${Date.now()}.${ext}`;

      const blob = new Blob([artifact.content], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch {
      toast.error("Failed to download file");
    }
  }, [artifact]);

  const previewHtml = useMemo(() => {
    if (!artifact) return "";
    const lang = (artifact.language || "").toLowerCase();
    if (lang === "html" || artifact.type === "html") {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 1.5rem; background: #ffffff; color: #111111; }
            </style>
          </head>
          <body>
            ${artifact.content}
          </body>
        </html>
      `;
    }
    if (lang === "svg" || artifact.type === "svg") {
      return artifact.content;
    }
    return "";
  }, [artifact]);

  if (!isOpen || !artifact) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          width: isFullScreen ? "100vw" : undefined,
        }}
        className={cn(
          "bg-surface border-border flex flex-col shadow-2xl transition-all duration-150",
          isFullScreen
            ? "fixed inset-0 z-50 h-dvh w-dvw"
            : "fixed inset-0 z-50 h-dvh w-full lg:relative lg:inset-auto lg:z-10 lg:h-full lg:border-l",
        )}
      >
        {/* Desktop Left Resize Handle */}
        {!isFullScreen && (
          <div
            onMouseDown={handleMouseDown}
            className="group/resizer hover:bg-primary/10 absolute top-0 bottom-0 -left-1.5 z-30 hidden w-3 cursor-col-resize items-center justify-center lg:flex"
            title="Drag to resize sidebar"
          >
            <div className="bg-border group-hover/resizer:bg-primary flex h-8 w-1 items-center justify-center rounded-full transition-colors">
              <GripVertical className="text-muted-foreground h-3 w-3 opacity-0 group-hover/resizer:opacity-100" />
            </div>
          </div>
        )}

        {/* Dynamic Width Style on Desktop */}
        <div
          className="flex h-full w-full flex-col overflow-hidden"
          style={{
            width:
              !isFullScreen &&
              typeof window !== "undefined" &&
              window.innerWidth >= 1024
                ? `${panelWidth}px`
                : "100%",
          }}
        >
          {/* Top Bar Header */}
          <div className="border-border bg-surface/90 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="bg-primary/5 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.06)]">
                <FileCode2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-foreground truncate text-xs font-semibold">
                    {artifact.title || "Artifact Canvas"}
                  </span>
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide uppercase">
                    {artifact.language || "text"}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1">
              {/* Tab Switcher for Previewables */}
              {isHtmlOrPreviewable && (
                <div className="bg-muted/70 mr-1.5 flex rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("code")}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                      activeTab === "code"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                      activeTab === "preview"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </button>
                </div>
              )}

              {/* Wrap / Unwrap Toggle */}
              {activeTab === "code" && (
                <IconTooltipButton
                  label={isWrapped ? "Unwrap lines" : "Wrap lines"}
                  side="bottom"
                  onClick={() => setIsWrapped((prev) => !prev)}
                  className={cn(
                    "text-muted-foreground hover:text-foreground h-8 w-8",
                    isWrapped && "bg-muted text-foreground",
                  )}
                >
                  <WrapText className="h-4 w-4" />
                </IconTooltipButton>
              )}

              {/* Copy */}
              <IconTooltipButton
                label={copied ? "Copied" : "Copy content"}
                side="bottom"
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground h-8 w-8"
              >
                {copied ? (
                  <Check className="text-primary h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </IconTooltipButton>

              {/* Download */}
              <IconTooltipButton
                label="Download file"
                side="bottom"
                onClick={handleDownload}
                className="text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </IconTooltipButton>

              {/* Fullscreen (Desktop) */}
              <IconTooltipButton
                label={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
                side="bottom"
                onClick={toggleFullScreen}
                className="text-muted-foreground hover:text-foreground hidden h-8 w-8 lg:inline-flex"
              >
                {isFullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </IconTooltipButton>

              {/* Close */}
              <IconTooltipButton
                label="Close canvas"
                side="bottom"
                onClick={closeArtifact}
                className="text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <X className="h-4 w-4" />
              </IconTooltipButton>
            </div>
          </div>

          {/* Canvas Scrollable Content */}
          <div className="relative flex-1 overflow-auto bg-[#1e1e1e]">
            {activeTab === "preview" && isHtmlOrPreviewable ? (
              artifact.language === "markdown" ||
              artifact.type === "markdown" ? (
                <div className="bg-background text-foreground h-full overflow-y-auto p-6">
                  <StreamdownWrapper>{artifact.content}</StreamdownWrapper>
                </div>
              ) : (
                <iframe
                  title="Artifact Live Preview"
                  srcDoc={previewHtml}
                  sandbox="allow-scripts allow-same-origin"
                  className="h-full w-full border-0 bg-white"
                />
              )
            ) : (
              <div className="h-full overflow-auto">
                <CodeBlockContent
                  code={artifact.content}
                  language={(artifact.language || "text") as BundledLanguage}
                  showLineNumbers
                  wrap={isWrapped}
                />
              </div>
            )}
          </div>

          {/* Canvas Footer */}
          <div className="border-border bg-surface text-muted-foreground flex h-8 shrink-0 items-center justify-between border-t px-4 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span>{artifact.content.split("\n").length} lines</span>
              <span>•</span>
              <span>{artifact.content.length} chars</span>
              {isWrapped && (
                <>
                  <span>•</span>
                  <span className="text-primary">wrapped</span>
                </>
              )}
            </div>
            <div className="text-muted-foreground/80 flex items-center gap-1.5 text-xs">
              <Sparkles className="h-3 w-3" />
              <span>Cognito Artifact</span>
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

"use client";

import { useMemo, useState, useCallback } from "react";
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
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "bg-surface border-border flex flex-col border-l shadow-xl transition-all duration-300",
          isFullScreen
            ? "fixed inset-0 z-50 h-dvh w-dvw"
            : "relative z-10 h-full w-full lg:w-[480px] xl:w-[580px] 2xl:w-[680px]",
        )}
      >
        {/* Canvas Top Bar */}
        <div className="border-border bg-surface/80 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-md">
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

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* View Switcher */}
            {isHtmlOrPreviewable && (
              <div className="bg-muted/70 mr-2 flex rounded-lg p-0.5 text-xs">
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
                  Code
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
                  Preview
                </button>
              </div>
            )}

            <IconTooltipButton
              label={copied ? "Copied" : "Copy content"}
              side="bottom"
              onClick={handleCopy}
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="text-primary h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </IconTooltipButton>

            <IconTooltipButton
              label="Download file"
              side="bottom"
              onClick={handleDownload}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </IconTooltipButton>

            <IconTooltipButton
              label={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
              side="bottom"
              onClick={toggleFullScreen}
              className="hidden h-8 w-8 sm:inline-flex"
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </IconTooltipButton>

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

        {/* Canvas Body */}
        <div className="relative flex-1 overflow-auto bg-[#1e1e1e]">
          {activeTab === "preview" && isHtmlOrPreviewable ? (
            artifact.language === "markdown" || artifact.type === "markdown" ? (
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
          </div>
          <div className="text-muted-foreground/80 flex items-center gap-1.5 text-xs">
            <Sparkles className="h-3 w-3" />
            <span>Cognito Artifact</span>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

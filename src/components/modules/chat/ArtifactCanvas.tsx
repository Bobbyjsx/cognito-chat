"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  WrapText,
} from "lucide-react";
import { CognitoIcon } from "@/components/ui/logo";
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

const MermaidDiagram = dynamic(
  () =>
    import("@/components/ai-elements/mermaid-diagram").then(
      (m) => m.MermaidDiagram,
    ),
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

interface ArtifactCanvasProps {
  className?: string;
}

export function ArtifactCanvas({ className }: ArtifactCanvasProps) {
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

  const isHtmlOrPreviewable = useMemo(() => {
    if (!artifact) return false;
    const lang = (artifact.language || "").toLowerCase();
    const type = artifact.type;
    return (
      type === "html" ||
      type === "svg" ||
      type === "markdown" ||
      type === "diagram" ||
      lang === "html" ||
      lang === "svg" ||
      lang === "markdown" ||
      lang === "md" ||
      lang === "mermaid"
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
    <AnimatePresence mode="wait">
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex h-full w-full flex-col overflow-hidden bg-[#1e1e2e] text-[#cdd6f4]",
          isFullScreen && "fixed inset-0 z-50 h-dvh w-dvw bg-[#1e1e2e]",
          className,
        )}
      >
        {/* Mocha Top Bar Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#313244] bg-[#181825] px-3.5 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#313244] bg-[#313244]/50 text-[#cba6f7]">
              <FileCode2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-[#cdd6f4]">
                  {artifact.title || "Artifact"}
                </span>
                <span className="py-0.2 rounded bg-[#313244] px-1.5 font-mono text-[10px] font-medium tracking-wide text-[#a6adc8] uppercase">
                  {artifact.language || "text"}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-1">
            {/* Tab Switcher for Previewables */}
            {isHtmlOrPreviewable && (
              <div className="mr-1 flex rounded-lg border border-[#313244] bg-[#11111b] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("code")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                    activeTab === "code"
                      ? "bg-[#313244] text-[#cdd6f4] shadow-xs"
                      : "text-[#6c7086] hover:text-[#cdd6f4]",
                  )}
                >
                  <Code2 className="h-3 w-3" />
                  <span>Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                    activeTab === "preview"
                      ? "bg-[#313244] text-[#cdd6f4] shadow-xs"
                      : "text-[#6c7086] hover:text-[#cdd6f4]",
                  )}
                >
                  <Eye className="h-3 w-3" />
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
                  "h-7 w-7 text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4]",
                  isWrapped && "bg-[#313244] text-[#cba6f7]",
                )}
              >
                <WrapText className="h-3.5 w-3.5" />
              </IconTooltipButton>
            )}

            {/* Copy */}
            <IconTooltipButton
              label={copied ? "Copied" : "Copy content"}
              side="bottom"
              onClick={handleCopy}
              className="h-7 w-7 text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4]"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[#a6e3a1]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </IconTooltipButton>

            {/* Download */}
            <IconTooltipButton
              label="Download file"
              side="bottom"
              onClick={handleDownload}
              className="h-7 w-7 text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4]"
            >
              <Download className="h-3.5 w-3.5" />
            </IconTooltipButton>

            {/* Fullscreen (Desktop only) */}
            <IconTooltipButton
              label={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
              side="bottom"
              onClick={toggleFullScreen}
              className="hidden h-7 w-7 text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4] lg:inline-flex"
            >
              {isFullScreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </IconTooltipButton>

            {/* Close */}
            <IconTooltipButton
              label="Close canvas"
              side="bottom"
              onClick={closeArtifact}
              className="h-7 w-7 text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4]"
            >
              <X className="h-3.5 w-3.5" />
            </IconTooltipButton>
          </div>
        </div>

        {/* Canvas Body with Mocha Editor */}
        <div className="relative flex-1 overflow-hidden bg-[#1e1e2e]">
          {activeTab === "preview" && isHtmlOrPreviewable ? (
            artifact.language === "markdown" || artifact.type === "markdown" ? (
              <div className="bg-background text-foreground h-full overflow-y-auto p-6">
                <StreamdownWrapper>{artifact.content}</StreamdownWrapper>
              </div>
            ) : artifact.language === "mermaid" ||
              artifact.type === "diagram" ? (
              <div className="bg-background text-foreground flex h-full items-center justify-center overflow-auto p-6">
                <MermaidDiagram code={artifact.content} />
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
            <div className="h-full w-full overflow-hidden">
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
        <div className="flex h-7 shrink-0 items-center justify-between border-t border-[#313244] bg-[#181825] px-3.5 font-mono text-[10px] text-[#6c7086]">
          <div className="flex items-center gap-2">
            <span>{artifact.content.split("\n").length} lines</span>
            <span>•</span>
            <span>{artifact.content.length} chars</span>
            {isWrapped && (
              <>
                <span>•</span>
                <span className="font-sans font-medium text-[#cba6f7]">
                  wrapped
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#6c7086]">
            <CognitoIcon size={12} className="text-[#cba6f7]" />
            <span>Cognito Canvas</span>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

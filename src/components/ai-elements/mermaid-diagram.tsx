import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MermaidDiagram({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "inherit",
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    let errorTimeout: NodeJS.Timeout;

    async function renderDiagram() {
      if (!code.trim()) return;
      try {
        setError(null);

        // Use mermaid.parse to validate syntax before attempting to render
        try {
          await mermaid.parse(code, { suppressErrors: true });
        } catch (parseError) {
          throw new Error("Invalid Mermaid syntax");
        }

        const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const { svg } = await mermaid.render(id, code);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        if (isMounted) {
          // If it fails to parse (often due to incomplete code during streaming),
          // delay showing the error. If new code arrives, this timeout is cleared.
          // This gives the agent time to finish typing the diagram without flashing errors.
          errorTimeout = setTimeout(() => {
            if (isMounted) {
              setError((err as Error).message || "Failed to render diagram");
            }
          }, 1500);
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
      clearTimeout(errorTimeout);
    };
  }, [code]);

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 p-4 font-mono text-xs text-red-400",
          className,
        )}
      >
        <span className="mb-1 font-semibold">Mermaid Error</span>
        <span className="text-center opacity-80">{error}</span>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div
        className={cn(
          "flex h-32 items-center justify-center rounded-xl border border-[#313244] bg-[#1e1e2e]",
          className,
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-[#a6adc8]" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "mermaid-wrapper flex justify-center overflow-x-auto",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

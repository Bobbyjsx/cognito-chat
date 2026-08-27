import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Loader2 } from "lucide-react";

export function MermaidDiagram({ code }: { code: string }) {
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

    async function renderDiagram() {
      if (!code.trim()) return;
      try {
        setError(null);
        const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const { svg } = await mermaid.render(id, code);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message || "Failed to render diagram");
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 font-mono text-xs text-red-400">
        Failed to render Mermaid diagram
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-[#313244] bg-[#1e1e2e]">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-wrapper my-2 flex justify-center overflow-x-auto rounded-xl bg-white/5 p-4"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

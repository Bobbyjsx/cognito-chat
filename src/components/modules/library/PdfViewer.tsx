"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  AlertCircle,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";
import { cn } from "@/lib/utils";

interface PdfViewerProps {
  url: string;
  filename?: string;
  className?: string;
  onDownload?: () => void;
  isDownloading?: boolean;
}

interface PdfJsModule {
  getDocument: (source: any) => {
    promise: Promise<any>;
    onProgress?: (data: { loaded: number; total: number }) => void;
  };
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

let cachedPdfJsPromise: Promise<PdfJsModule> | null = null;

function loadPdfJs(): Promise<PdfJsModule> {
  if (!cachedPdfJsPromise) {
    cachedPdfJsPromise = new Promise((resolve, reject) => {
      // Dynamically load the static vendor ES module to bypass build-time bundling
      const importDynamic = new Function(
        "modulePath",
        "return import(modulePath);",
      );

      importDynamic("/vendor/pdfjs/pdf.min.mjs")
        .then((mod: PdfJsModule) => {
          if (mod.GlobalWorkerOptions) {
            mod.GlobalWorkerOptions.workerSrc =
              "/vendor/pdfjs/pdf.worker.min.mjs";
          }
          resolve(mod);
        })
        .catch((err: unknown) => {
          // Fallback to CDN if vendor file is unreachable for any reason
          importDynamic(
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs",
          )
            .then((mod: PdfJsModule) => {
              if (mod.GlobalWorkerOptions) {
                mod.GlobalWorkerOptions.workerSrc =
                  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
              }
              resolve(mod);
            })
            .catch(reject);
        });
    });
  }
  return cachedPdfJsPromise;
}

interface PageItemProps {
  pdfDoc: any;
  pageNumber: number;
  scale: number;
  baseAspectRatio: number;
  containerWidth: number;
  onVisible: (pageNumber: number) => void;
}

function PdfPageItem({
  pdfDoc,
  pageNumber,
  scale,
  baseAspectRatio,
  containerWidth,
  onVisible,
}: PageItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  // Compute responsive page width & height based on container & zoom scale
  const targetWidth = Math.min(
    Math.max(300, (containerWidth - 64) * scale),
    1200 * scale,
  );
  const targetHeight = targetWidth / (baseAspectRatio || 1 / 1.414);

  // Observe when page enters viewport area (with 400px margin for preloading)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            onVisible(pageNumber);
          }
        }
      },
      {
        rootMargin: "400px 0px 400px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onVisible]);

  // Render page to canvas whenever it intersects or scale changes
  useEffect(() => {
    if (!isIntersecting || !pdfDoc || !canvasRef.current) return;

    let isMounted = true;
    setIsRendering(true);

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Ignore cancellation error
      }
      renderTaskRef.current = null;
    }

    pdfDoc
      .getPage(pageNumber)
      .then((page: any) => {
        if (!isMounted || !canvasRef.current) return;

        const rawViewport = page.getViewport({ scale: 1.0 });
        const computedScale = targetWidth / rawViewport.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const viewport = page.getViewport({ scale: computedScale * dpr });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(targetWidth)}px`;
        canvas.style.height = `${Math.floor(targetHeight)}px`;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        return renderTask.promise;
      })
      .then(() => {
        if (isMounted) {
          setIsRendered(true);
          setIsRendering(false);
        }
      })
      .catch((err: any) => {
        if (err?.name === "RenderingCancelledException") return;
        if (isMounted) {
          setIsRendering(false);
        }
      });

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Ignore cancellation
        }
      }
    };
  }, [isIntersecting, pdfDoc, pageNumber, targetWidth, targetHeight]);

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      style={{
        width: `${Math.floor(targetWidth)}px`,
        height: `${Math.floor(targetHeight)}px`,
      }}
      className={cn(
        "relative shrink-0 rounded-sm bg-white text-neutral-900 shadow-lg shadow-black/15 transition-all duration-200",
        "border border-neutral-200/80 dark:border-neutral-800",
      )}
    >
      {/* Loading Skeleton / Placeholder */}
      {(!isRendered || isRendering) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-900/90">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none opacity-40" />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <Spinner className="h-5 w-5 text-neutral-400" />
            <span className="text-xs font-medium text-neutral-400">
              Page {pageNumber}
            </span>
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={cn(
          "block h-full w-full rounded-sm object-contain transition-opacity duration-200",
          isRendered ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

export function PdfViewer({
  url,
  filename = "document.pdf",
  className,
  onDownload,
  isDownloading = false,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [baseAspectRatio, setBaseAspectRatio] = useState<number>(1 / 1.414);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Measure container width for responsive scaling
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    let loadedDoc: any = null;

    loadPdfJs()
      .then((pdfjs) => {
        if (!isMounted) return;

        const loadingTask = pdfjs.getDocument({
          url,
          withCredentials: true,
        });

        return loadingTask.promise;
      })
      .then(async (doc: any) => {
        if (!isMounted || !doc) return;
        loadedDoc = doc;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoadError(null);

        // Sample Page 1 for aspect ratio
        try {
          const firstPage = await doc.getPage(1);
          const viewport = firstPage.getViewport({ scale: 1.0 });
          if (viewport.width && viewport.height) {
            setBaseAspectRatio(viewport.width / viewport.height);
          }
        } catch {
          // Keep default A4 ratio if page 1 inspect fails
        }

        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error("Failed to load PDF:", err);
        setLoadError(
          err instanceof Error
            ? err.message
            : "Could not open PDF file. The file may be corrupt or unreachable.",
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      if (loadedDoc) {
        try {
          loadedDoc.destroy();
        } catch {
          // Ignore destruction errors
        }
      }
    };
  }, [url]);

  // Page visibility callback from PageItem
  const handlePageVisible = useCallback((pageNumber: number) => {
    startTransition(() => {
      setCurrentPage(pageNumber);
    });
  }, []);

  // Scroll to a specific page
  const scrollToPage = useCallback((pageNum: number) => {
    const targetEl = document.getElementById(`pdf-page-${pageNum}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, +(prev + 0.2).toFixed(1)));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.5, +(prev - 0.2).toFixed(1)));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "PageDown" || (e.key === "ArrowDown" && e.altKey)) {
        e.preventDefault();
        if (currentPage < numPages) scrollToPage(currentPage + 1);
      } else if (e.key === "PageUp" || (e.key === "ArrowUp" && e.altKey)) {
        e.preventDefault();
        if (currentPage > 1) scrollToPage(currentPage - 1);
      } else if (e.key === "+" || e.key === "=") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleZoomIn();
        }
      } else if (e.key === "-") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleZoomOut();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, numPages, scrollToPage]);

  // Loading State
  if (isLoading) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full flex-col items-center justify-center p-6 text-center",
          className,
        )}
      >
        <div className="relative flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-md">
          <div className="bg-primary/10 text-primary relative flex h-14 w-14 items-center justify-center rounded-2xl">
            <Spinner className="text-primary h-7 w-7" />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium text-white">
              Preparing document...
            </p>
            <p className="text-xs text-white/60">Rendering pages smoothly</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (loadError || !pdfDoc) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full flex-col items-center justify-center p-6 text-center",
          className,
        )}
      >
        <div className="relative flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-md">
          <div className="bg-destructive/10 text-destructive flex h-14 w-14 items-center justify-center rounded-2xl">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium text-white">
              Unable to preview document
            </p>
            <p className="text-xs text-white/60">
              {loadError || "The document could not be loaded."}
            </p>
          </div>
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              disabled={isDownloading}
              onClick={onDownload}
              className="mt-2 border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              {isDownloading ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isDownloading ? "Downloading..." : "Download File"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-full w-full flex-col items-center overflow-hidden select-none",
        className,
      )}
    >
      {/* Smooth Scroll Container */}
      <div className="no-scrollbar relative flex h-full w-full flex-col items-center gap-6 overflow-x-hidden overflow-y-auto p-4 md:p-8">
        {pageNumbers.map((num) => (
          <PdfPageItem
            key={num}
            pdfDoc={pdfDoc}
            pageNumber={num}
            scale={scale}
            baseAspectRatio={baseAspectRatio}
            containerWidth={containerWidth}
            onVisible={handlePageVisible}
          />
        ))}
      </div>

      {/* Floating Controls Bar */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-black/75 px-3 py-1.5 shadow-2xl backdrop-blur-xl transition-all">
        {/* Page Nav */}
        <IconTooltipButton
          label="Previous page"
          side="top"
          className="h-7 w-7 text-white/80 hover:bg-white/15 hover:text-white"
          disabled={currentPage <= 1}
          onClick={() => scrollToPage(currentPage - 1)}
        >
          <ChevronUp className="h-4 w-4" />
        </IconTooltipButton>

        <span className="px-1 text-xs font-medium text-white/90">
          {currentPage} <span className="text-white/40">/</span> {numPages}
        </span>

        <IconTooltipButton
          label="Next page"
          side="top"
          className="h-7 w-7 text-white/80 hover:bg-white/15 hover:text-white"
          disabled={currentPage >= numPages}
          onClick={() => scrollToPage(currentPage + 1)}
        >
          <ChevronDown className="h-4 w-4" />
        </IconTooltipButton>

        {/* Separator */}
        <div className="mx-1 h-3.5 w-px bg-white/20" />

        {/* Zoom Controls */}
        <IconTooltipButton
          label="Zoom out"
          side="top"
          className="h-7 w-7 text-white/80 hover:bg-white/15 hover:text-white"
          disabled={scale <= 0.6}
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </IconTooltipButton>

        <button
          type="button"
          onClick={handleResetZoom}
          aria-label="Reset zoom"
          className="h-7 cursor-pointer rounded-md px-1.5 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          {Math.round(scale * 100)}%
        </button>

        <IconTooltipButton
          label="Zoom in"
          side="top"
          className="h-7 w-7 text-white/80 hover:bg-white/15 hover:text-white"
          disabled={scale >= 2.4}
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </IconTooltipButton>

        {/* Download Button */}
        {onDownload && (
          <>
            <div className="mx-1 h-3.5 w-px bg-white/20" />
            <IconTooltipButton
              label={isDownloading ? "Downloading..." : `Download ${filename}`}
              side="top"
              disabled={isDownloading}
              className="h-7 w-7 text-white/80 hover:bg-white/15 hover:text-white"
              onClick={onDownload}
            >
              {isDownloading ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
            </IconTooltipButton>
          </>
        )}
      </div>
    </div>
  );
}

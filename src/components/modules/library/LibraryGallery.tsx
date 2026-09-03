"use client";

import { useGetLibraryAttachments } from "@/hooks/data/useAttachments/useAttachments";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  MessageSquare,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  FileText,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/axios";
import type { AttachmentSchema } from "@/types";

type FilterType =
  "all" | "image" | "document" | "json" | "spreadsheet" | "audio" | "video";

interface LibraryGalleryProps {
  onMenuClick?: () => void;
}

export function LibraryGallery({ onMenuClick }: LibraryGalleryProps) {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const mimeTypeFilter = filterType === "all" ? undefined : filterType;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useGetLibraryAttachments(mimeTypeFilter, debouncedQuery, 15);

  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null,
  );

  const allItems = data?.pages.flatMap((page) => page?.items || []) || [];

  // Deduplicate by ID to prevent infinite scroll shift duplicates
  const uniqueItems = Array.from(
    new Map(allItems.map((item) => [item.id, item])).values(),
  );

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 },
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleDownload = async (attachment: AttachmentSchema) => {
    try {
      const response = await api.get(
        `/agent/attachments/${attachment.id}/content`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  const handleShare = async (attachment: AttachmentSchema) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: attachment.filename,
          url: `${window.location.origin}/agent/attachments/${attachment.id}/content`,
        });
      } catch (error) {
        console.error("Share failed", error);
      }
    }
  };

  const selectedItem =
    selectedItemIndex !== null ? uniqueItems[selectedItemIndex] : null;

  const navigatePrev = () => {
    if (selectedItemIndex !== null && selectedItemIndex > 0) {
      setSelectedItemIndex(selectedItemIndex - 1);
    }
  };

  const navigateNext = () => {
    if (
      selectedItemIndex !== null &&
      selectedItemIndex < uniqueItems.length - 1
    ) {
      setSelectedItemIndex(selectedItemIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedItemIndex === null) return;
      if (e.key === "Escape") setSelectedItemIndex(null);
      if (e.key === "ArrowLeft") navigatePrev();
      if (e.key === "ArrowRight") navigateNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemIndex, navigatePrev, navigateNext]);

  const isImage = (mimeType: string) => mimeType.startsWith("image/");
  const isPDF = (mimeType: string) => mimeType === "application/pdf";

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 lg:px-6">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuClick}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>
          )}
          <h1 className="text-lg font-semibold">Library</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-input focus:ring-ring h-9 w-64 rounded-full border bg-transparent pr-4 pl-9 text-sm focus:ring-1 focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* Filter Row */}
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <Button
            variant={filterType === "all" ? "default" : "ghost"}
            className="h-8 rounded-full px-4 whitespace-nowrap"
            onClick={() => setFilterType("all")}
          >
            All
          </Button>
          <Button
            variant={filterType === "image" ? "default" : "ghost"}
            className="h-8 rounded-full px-4 whitespace-nowrap"
            onClick={() => setFilterType("image")}
          >
            Images
          </Button>
          <Button
            variant={filterType === "document" ? "default" : "ghost"}
            className="h-8 rounded-full px-4 whitespace-nowrap"
            onClick={() => setFilterType("document")}
          >
            Documents
          </Button>
          <Button
            variant={filterType === "json" ? "default" : "ghost"}
            className="h-8 rounded-full px-4 whitespace-nowrap"
            onClick={() => setFilterType("json")}
          >
            JSON
          </Button>
          <Button
            variant={filterType === "spreadsheet" ? "default" : "ghost"}
            className="h-8 rounded-full px-4 whitespace-nowrap"
            onClick={() => setFilterType("spreadsheet")}
          >
            Spreadsheets
          </Button>
          <Button
            variant={filterType === "audio" ? "default" : "ghost"}
            className="h-8 rounded-full px-4 whitespace-nowrap"
            onClick={() => setFilterType("audio")}
          >
            Audio
          </Button>
          <Button
            variant={filterType === "video" ? "default" : "ghost"}
            className="h-8 rounded-full px-4 whitespace-nowrap"
            onClick={() => setFilterType("video")}
          >
            Video
          </Button>
        </div>
      </div>

      {/* Grid */}
      <main className="flex-1 overflow-y-auto px-4 pb-4 lg:px-6">
        {status === "pending" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <Skeleton key={idx} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        ) : uniqueItems.length === 0 ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-center">
            <p>No items found.</p>
            <p className="text-sm">
              Items you generate or upload will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {uniqueItems.map((item, idx) => {
              const imgUrl = `/agent/attachments/${item.id}/content`;
              const isImg = isImage(item.mimeType);

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemIndex(idx)}
                  className="group bg-surface-container-low focus-visible:ring-ring relative flex aspect-square w-full flex-col overflow-hidden rounded-xl border text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
                >
                  {isImg ? (
                    <OptimizedImage
                      src={imgUrl}
                      alt={item.filename}
                      fill
                      containerClassName="h-full w-full"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="bg-surface-container flex flex-1 flex-col items-center justify-center p-4">
                      {isPDF(item.mimeType) ? (
                        <FileText className="h-12 w-12 text-blue-500 opacity-80" />
                      ) : (
                        <File className="h-12 w-12 text-gray-500 opacity-80" />
                      )}
                    </div>
                  )}
                  <div className="bg-background/80 absolute right-0 bottom-0 left-0 border-t p-3 backdrop-blur-sm">
                    <p className="truncate text-sm font-medium">
                      {item.filename}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(item.uploadedAt))}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div ref={observerTarget} className="h-4 w-full" />
        {isFetchingNextPage && (
          <div className="flex justify-center p-4">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        )}
      </main>

      {/* Full Screen Modal */}
      {selectedItem &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="bg-background/95 fixed inset-0 z-[100] flex flex-col backdrop-blur-sm">
            {/* Top Bar */}
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex flex-col">
                <span className="text-foreground max-w-[200px] truncate font-medium sm:max-w-[400px]">
                  {selectedItem.filename}
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(selectedItem.uploadedAt))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleShare(selectedItem)}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(selectedItem)}
                >
                  <Download className="h-5 w-5" />
                </Button>
                {selectedItem.sessionId && (
                  <Link href={`/chat/${selectedItem.sessionId}`}>
                    <Button variant="ghost" size="icon">
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedItemIndex(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Carousel Body */}
            <div className="relative flex flex-1 items-center justify-center p-4">
              {selectedItemIndex !== null && selectedItemIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/50 hover:bg-background/80 absolute left-4 z-10 h-12 w-12 rounded-full"
                  onClick={navigatePrev}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                {isImage(selectedItem.mimeType) ? (
                  <OptimizedImage
                    src={`/agent/attachments/${selectedItem.id}/content`}
                    alt={selectedItem.filename}
                    fill
                    containerClassName="h-full w-full border-none rounded-none"
                    className="object-contain"
                  />
                ) : isPDF(selectedItem.mimeType) ? (
                  <iframe
                    src={`/agent/attachments/${selectedItem.id}/content`}
                    title={selectedItem.filename}
                    className="h-full w-full max-w-4xl rounded-xl bg-white shadow-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <File className="text-muted-foreground h-24 w-24 opacity-50" />
                    <p className="text-lg font-medium">Preview not available</p>
                    <Button onClick={() => handleDownload(selectedItem)}>
                      Download File
                    </Button>
                  </div>
                )}
              </div>

              {selectedItemIndex !== null &&
                selectedItemIndex < uniqueItems.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/50 hover:bg-background/80 absolute right-4 z-10 h-12 w-12 rounded-full"
                    onClick={navigateNext}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

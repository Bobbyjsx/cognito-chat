"use client";

import {
  useGetLibraryAttachments,
  useDeleteAttachment,
} from "@/hooks/data/useAttachments/useAttachments";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  FileText,
  File,
} from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PdfViewer } from "@/components/modules/library/PdfViewer";
import { LibraryAttachmentActionsMenu } from "@/components/modules/library/LibraryAttachmentActionsMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/axios";
import type { AttachmentSchema } from "@/types";

type FilterType =
  "all" | "image" | "document" | "json" | "spreadsheet" | "audio" | "video";

interface LibraryAttachmentCardProps {
  item: AttachmentSchema;
  idx: number;
  imgUrl: string;
  isImg: boolean;
  isPdf: boolean;
  downloadingId: string | null;
  isDeleting: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onGoToChat?: () => void;
}

function LibraryAttachmentCard({
  item,
  isImg,
  isPdf,
  imgUrl,
  downloadingId,
  isDeleting,
  onSelect,
  onDownload,
  onDelete,
  onGoToChat,
}: LibraryAttachmentCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDownloading = downloadingId === item.id;

  return (
    <div
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      className="group bg-surface-container-low focus-visible:ring-ring relative flex aspect-square w-full cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
    >
      {isImg ? (
        <OptimizedImage
          src={imgUrl}
          attachmentId={item.id}
          urlExpiresAt={item.urlExpiresAt}
          alt={item.filename}
          fill
          containerClassName="h-full w-full"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="bg-surface-container flex flex-1 flex-col items-center justify-center p-4">
          {isPdf ? (
            <FileText className="h-12 w-12 text-blue-500 opacity-80" />
          ) : (
            <File className="h-12 w-12 text-gray-500 opacity-80" />
          )}
        </div>
      )}

      {/* Card quick actions - Menu Ellipsis */}
      <div
        className={cn(
          "absolute top-2 right-2 z-10 flex items-center transition-opacity",
          isMenuOpen || isDownloading || isDeleting
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <LibraryAttachmentActionsMenu
          open={isMenuOpen}
          onOpenChange={setIsMenuOpen}
          onDownload={onDownload}
          onDelete={onDelete}
          onGoToChat={onGoToChat}
          isDownloading={isDownloading}
          isDeleting={isDeleting}
          triggerClassName="bg-background/85 hover:bg-background text-foreground size-7 rounded-lg border border-border/80 shadow-xs backdrop-blur-md"
        />
      </div>

      <div className="bg-background/80 absolute right-0 bottom-0 left-0 border-t p-3 backdrop-blur-sm">
        <p className="truncate text-sm font-medium">{item.filename}</p>
        <p className="text-muted-foreground text-xs">
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
          }).format(new Date(item.uploadedAt))}
        </p>
      </div>
    </div>
  );
}

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

  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null,
  );
  const [itemToDelete, setItemToDelete] = useState<AttachmentSchema | null>(
    null,
  );
  const deleteAttachmentMutation = useDeleteAttachment();

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
    if (downloadingId) return;
    setDownloadingId(attachment.id);
    try {
      // 1. If we have a direct download_url (signed with Content-Disposition: attachment)
      if (attachment.downloadUrl) {
        const a = document.createElement("a");
        a.href = attachment.downloadUrl;
        a.download = attachment.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      // 2. Fallback: fetch blob from backend content endpoint and download via blob URL
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
      toast.error("Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || deleteAttachmentMutation.isPending) return;
    const targetId = itemToDelete.id;
    try {
      await deleteAttachmentMutation.mutateAsync(targetId);
      toast.success("Attachment deleted");
      if (selectedItem?.id === targetId) {
        setSelectedItemIndex(null);
      }
      setItemToDelete(null);
    } catch (error) {
      console.error("Failed to delete attachment", error);
      toast.error("Failed to delete attachment");
    }
  };

  const selectedItem =
    selectedItemIndex !== null ? uniqueItems[selectedItemIndex] : null;

  const navigatePrev = () => {
    setSelectedItemIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : prev,
    );
  };

  const navigateNext = () => {
    setSelectedItemIndex((prev) =>
      prev !== null && prev < uniqueItems.length - 1 ? prev + 1 : prev,
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedItemIndex === null) return;
      if (e.key === "Escape") setSelectedItemIndex(null);
      if (e.key === "ArrowLeft") {
        setSelectedItemIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : prev,
        );
      }
      if (e.key === "ArrowRight") {
        setSelectedItemIndex((prev) =>
          prev !== null && prev < uniqueItems.length - 1 ? prev + 1 : prev,
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemIndex, uniqueItems.length]);

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
              const imgUrl =
                item.url || `/agent/attachments/${item.id}/content`;
              const isImg = isImage(item.mimeType);
              const isPdf = isPDF(item.mimeType);

              return (
                <LibraryAttachmentCard
                  key={item.id}
                  item={item}
                  idx={idx}
                  imgUrl={imgUrl}
                  isImg={isImg}
                  isPdf={isPdf}
                  downloadingId={downloadingId}
                  isDeleting={
                    deleteAttachmentMutation.isPending &&
                    itemToDelete?.id === item.id
                  }
                  onSelect={() => setSelectedItemIndex(idx)}
                  onDownload={() => handleDownload(item)}
                  onDelete={() => setItemToDelete(item)}
                  onGoToChat={
                    item.sessionId
                      ? () => router.push(`/chat/${item.sessionId}`)
                      : undefined
                  }
                />
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
          <div className="bg-background/95 fixed inset-0 z-40 flex flex-col backdrop-blur-sm">
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
              <div className="flex items-center gap-1.5">
                <LibraryAttachmentActionsMenu
                  onDownload={() => handleDownload(selectedItem)}
                  onDelete={() => setItemToDelete(selectedItem)}
                  onGoToChat={
                    selectedItem.sessionId
                      ? () => {
                          const sid = selectedItem.sessionId;
                          setSelectedItemIndex(null);
                          router.push(`/chat/${sid}`);
                        }
                      : undefined
                  }
                  isDownloading={downloadingId === selectedItem.id}
                  isDeleting={
                    deleteAttachmentMutation.isPending &&
                    itemToDelete?.id === selectedItem.id
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedItemIndex(null)}
                  title="Close"
                  aria-label="Close"
                  className="text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground h-8 w-8 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Carousel Body */}
            <div className="relative flex flex-1 items-center justify-center p-4">
              {selectedItemIndex !== null && selectedItemIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/85 hover:bg-background text-foreground border-border/80 absolute left-4 z-10 h-11 w-11 rounded-full border shadow-md shadow-black/10 backdrop-blur-md transition-all active:scale-95"
                  onClick={navigatePrev}
                  title="Previous"
                  aria-label="Previous file"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                {isImage(selectedItem.mimeType) ? (
                  <OptimizedImage
                    src={
                      selectedItem.url ||
                      `/agent/attachments/${selectedItem.id}/content`
                    }
                    attachmentId={selectedItem.id}
                    urlExpiresAt={selectedItem.urlExpiresAt}
                    alt={selectedItem.filename}
                    fill
                    containerClassName="h-full w-full border-none rounded-none"
                    className="object-contain"
                  />
                ) : isPDF(selectedItem.mimeType) ? (
                  <PdfViewer
                    key={selectedItem.url || selectedItem.id}
                    url={
                      selectedItem.url ||
                      `/agent/attachments/${selectedItem.id}/content`
                    }
                    filename={selectedItem.filename}
                    onDownload={() => handleDownload(selectedItem)}
                    isDownloading={downloadingId === selectedItem.id}
                    className="h-full w-full max-w-4xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <File className="text-muted-foreground h-24 w-24 opacity-50" />
                    <p className="text-lg font-medium">Preview not available</p>
                    <Button
                      disabled={downloadingId === selectedItem.id}
                      onClick={() => handleDownload(selectedItem)}
                    >
                      {downloadingId === selectedItem.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      {downloadingId === selectedItem.id
                        ? "Downloading..."
                        : "Download File"}
                    </Button>
                  </div>
                )}
              </div>

              {selectedItemIndex !== null &&
                selectedItemIndex < uniqueItems.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/85 hover:bg-background text-foreground border-border/80 absolute right-4 z-10 h-11 w-11 rounded-full border shadow-md shadow-black/10 backdrop-blur-md transition-all active:scale-95"
                    onClick={navigateNext}
                    title="Next"
                    aria-label="Next file"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}
            </div>
          </div>,
          document.body,
        )}

      {/* Delete from Library Confirmation Dialog */}
      <Dialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteAttachmentMutation.isPending) {
            setItemToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete from library?</DialogTitle>
            <DialogDescription>
              {itemToDelete?.filename
                ? `"${itemToDelete.filename}" will be removed from your library. This won't affect messages that reference this attachment.`
                : "This attachment will be removed from your library. This won't affect messages that reference this attachment."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setItemToDelete(null)}
              disabled={deleteAttachmentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteAttachmentMutation.isPending}
              className="gap-1.5"
            >
              {deleteAttachmentMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

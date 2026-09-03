"use client";

import { useGetLibraryAttachments } from "@/hooks/data/useAttachments/useAttachments";
import { File, FileText, Music, Video, FileJson, Table } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Skeleton } from "@/components/ui/skeleton";
import type { AttachmentSchema } from "@/types";
import { cn } from "@/lib/utils";

interface LibraryGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (attachment: AttachmentSchema) => void;
}

function FileIcon({
  mimeType,
  className,
}: {
  mimeType: string;
  className?: string;
}) {
  if (mimeType === "application/pdf")
    return <FileText className={cn("text-red-400", className)} />;
  if (mimeType === "application/json" || mimeType.includes("json"))
    return <FileJson className={cn("text-yellow-500", className)} />;
  if (mimeType.startsWith("audio/"))
    return <Music className={cn("text-purple-400", className)} />;
  if (mimeType.startsWith("video/"))
    return <Video className={cn("text-blue-400", className)} />;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return <Table className={cn("text-green-500", className)} />;
  return <File className={cn("text-muted-foreground", className)} />;
}

export function LibraryGalleryModal({
  open,
  onOpenChange,
  onSelect,
}: LibraryGalleryModalProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useGetLibraryAttachments(undefined, undefined, 24);

  // Flatten all pages and deduplicate by id
  const allItems = data?.pages.flatMap((page) => page?.items || []) ?? [];
  const uniqueItems = Array.from(
    new Map(allItems.map((i) => [i.id, i])).values(),
  );

  const isImage = (mimeType: string) => mimeType.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Square-ish: wide and not too tall */}
      <DialogContent className="flex max-h-[72dvh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-5 py-3.5">
          <DialogTitle className="text-sm font-semibold">Library</DialogTitle>
        </DialogHeader>

        {/* Scrollable grid area */}
        <div className="flex-1 overflow-y-auto p-4">
          {status === "pending" ? (
            /* Skeleton */
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 18 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
          ) : uniqueItems.length === 0 ? (
            <div className="text-muted-foreground flex h-48 flex-col items-center justify-center gap-2 text-center">
              <File className="h-10 w-10 opacity-30" />
              <p className="text-sm">No files in your library yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {uniqueItems.map((item) => {
                  const imgUrl = `/agent/attachments/${item.id}/content`;
                  const isImg = isImage(item.mimeType);

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelect(item);
                        onOpenChange(false);
                      }}
                      className="group border-border/60 bg-muted/30 hover:border-border focus-visible:ring-ring relative aspect-square w-full overflow-hidden rounded-xl border transition-all duration-150 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none active:scale-[0.96]"
                    >
                      {isImg ? (
                        <OptimizedImage
                          src={imgUrl}
                          alt={item.filename}
                          fill
                          containerClassName="h-full w-full rounded-none border-none"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2">
                          <FileIcon
                            mimeType={item.mimeType}
                            className="h-8 w-8 opacity-70"
                          />
                          <span className="text-muted-foreground line-clamp-2 text-center text-[9px] leading-tight">
                            {item.filename}
                          </span>
                        </div>
                      )}

                      {/* Filename overlay on hover for images */}
                      {isImg && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pt-4 pb-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <p className="truncate text-[9px] font-medium text-white">
                            {item.filename}
                          </p>
                        </div>
                      )}

                      {/* Active ring flash */}
                      <div className="ring-primary absolute inset-0 rounded-xl ring-0 transition-all duration-150 group-active:ring-2" />
                    </button>
                  );
                })}
              </div>

              {/* Project's InfiniteScroll component handles sentinel + loader */}
              <InfiniteScroll
                hasNextPage={hasNextPage ?? false}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                endMessage=""
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

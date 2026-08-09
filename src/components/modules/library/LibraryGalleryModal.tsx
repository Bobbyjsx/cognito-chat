"use client";

import { useGetLibraryAttachments } from "@/hooks/data/useAttachments/useAttachments";
import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AttachmentSchema } from "@/types";

interface LibraryGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (attachment: AttachmentSchema) => void;
}

export function LibraryGalleryModal({
  open,
  onOpenChange,
  onSelect,
}: LibraryGalleryModalProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useGetLibraryAttachments("image", 20);
  const observerTarget = useRef<HTMLDivElement>(null);

  const allImages = data?.pages.flatMap((page) => page.items) || [];

  useEffect(() => {
    if (!open) return;
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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>Choose from App Gallery</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {status === "pending" ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : allImages.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-center">
              <p>No images found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {allImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() => {
                    onSelect(image);
                    onOpenChange(false);
                  }}
                  className="group bg-muted focus-visible:ring-ring relative aspect-square overflow-hidden rounded-lg border focus-visible:ring-2 focus-visible:outline-none"
                >
                  <img
                    src={`/agent/attachments/${image.id}/content`}
                    alt={image.filename}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          <div ref={observerTarget} className="h-4 w-full" />
          {isFetchingNextPage && (
            <div className="flex justify-center p-4">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

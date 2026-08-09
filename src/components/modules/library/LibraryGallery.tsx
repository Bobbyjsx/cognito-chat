"use client";

import { useGetLibraryAttachments } from "@/hooks/data/useAttachments/useAttachments";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/axios";
import type { AttachmentSchema } from "@/types";

export function LibraryGallery() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useGetLibraryAttachments("image", 30);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  // Flatten pages into a single array
  const allImages = data?.pages.flatMap((page) => page.items) || [];

  // Setup intersection observer for infinite scroll
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
        {
          responseType: "blob",
        },
      );
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
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

  const selectedImage =
    selectedImageIndex !== null ? allImages[selectedImageIndex] : null;

  const navigatePrev = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const navigateNext = () => {
    if (
      selectedImageIndex !== null &&
      selectedImageIndex < allImages.length - 1
    ) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === "Escape") setSelectedImageIndex(null);
      if (e.key === "ArrowLeft") navigatePrev();
      if (e.key === "ArrowRight") navigateNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, navigatePrev, navigateNext]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4 lg:px-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Image Library</h1>
      </header>

      {/* Grid */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {status === "pending" ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : allImages.length === 0 ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-center">
            <p>No images found.</p>
            <p className="text-sm">
              Images you generate or upload will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {allImages.map((image, idx) => (
              <button
                key={image.id}
                onClick={() => setSelectedImageIndex(idx)}
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
      </main>

      {/* Full Screen Modal */}
      {selectedImage && (
        <div className="bg-background/95 fixed inset-0 z-50 flex flex-col backdrop-blur-sm">
          {/* Top Bar */}
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex flex-col">
              <span className="text-foreground max-w-[200px] truncate font-medium sm:max-w-[400px]">
                {selectedImage.filename}
              </span>
              <span className="text-muted-foreground text-xs">
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(selectedImage.uploadedAt))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleShare(selectedImage)}
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDownload(selectedImage)}
              >
                <Download className="h-5 w-5" />
              </Button>
              {selectedImage.sessionId && (
                <Link href={`/chat/${selectedImage.sessionId}`}>
                  <Button variant="ghost" size="icon">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedImageIndex(null)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Carousel Body */}
          <div className="relative flex flex-1 items-center justify-center p-4">
            {selectedImageIndex !== null && selectedImageIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/50 hover:bg-background/80 absolute left-4 z-10 h-12 w-12 rounded-full"
                onClick={navigatePrev}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            <div className="relative flex h-full w-full items-center justify-center">
              <img
                src={`/agent/attachments/${selectedImage.id}/content`}
                alt={selectedImage.filename}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {selectedImageIndex !== null &&
              selectedImageIndex < allImages.length - 1 && (
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
        </div>
      )}
    </div>
  );
}

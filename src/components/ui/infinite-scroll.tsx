import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfiniteScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  loadingMessage?: string;
  endMessage?: string;
}

export function InfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loadingMessage = "Loading more...",
  endMessage = "You're all caught up",
  className,
  ...props
}: InfiniteScrollProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div
      ref={observerRef}
      className={cn(
        "flex w-full items-center justify-center p-4 text-sm text-gray-500",
        className,
      )}
      {...props}
    >
      {isFetchingNextPage ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingMessage}</span>
        </div>
      ) : !hasNextPage ? (
        <span className="text-gray-400 italic">{endMessage}</span>
      ) : null}
    </div>
  );
}

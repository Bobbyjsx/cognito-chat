"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Image as ImageIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

import { useSecureImage } from "@/hooks/data/useSecureImage";

export interface OptimizedImageProps extends Omit<ImageProps, "src"> {
  src: string | null;
  attachmentId?: string;
  urlExpiresAt?: string | Date | null;
  sizeBytes?: number;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  onImageClick?: (url: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Optimized Image Component with Shimmer and UX enhancements.
 * Shows image size, blurs while loading, and displays a doughnut progress bar.
 */
export const OptimizedImage = ({
  src,
  alt,
  attachmentId,
  urlExpiresAt,
  containerClassName,
  className,
  fallbackIcon,
  containerProps,
  sizeBytes,
  onImageClick,
  ...props
}: OptimizedImageProps) => {
  const isPriority = !!props.priority;

  const {
    objectUrl,
    loading: secureLoading,
    error: secureError,
    retry,
    handleImageError,
  } = useSecureImage(src, {
    attachmentId,
    urlExpiresAt,
  });

  const [imgLoading, setImgLoading] = useState(!isPriority);
  const [imgError, setImgError] = useState(false);

  React.useEffect(() => {
    if (!isPriority) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImgLoading(true);
    }

    setImgError(false);
  }, [src, isPriority]);

  const isLoading = secureLoading || imgLoading;
  const error = secureError || imgError;

  const isFill = !!props.fill;
  const isBlob = typeof objectUrl === "string" && objectUrl.startsWith("blob:");
  const isExternal =
    typeof objectUrl === "string" &&
    (objectUrl.startsWith("http://") || objectUrl.startsWith("https://"));
  const isSvg = Boolean(
    (typeof objectUrl === "string" &&
      (objectUrl.endsWith(".svg") ||
        objectUrl.includes(".svg?") ||
        objectUrl.includes("image/svg+xml") ||
        objectUrl.startsWith("data:image/svg+xml"))) ||
    (typeof src === "string" &&
      (src.endsWith(".svg") ||
        src.includes(".svg?") ||
        src.includes("image/svg+xml") ||
        src.startsWith("data:image/svg+xml"))) ||
    (typeof alt === "string" && alt.toLowerCase().endsWith(".svg")),
  );

  if (!src || error) {
    return (
      <div
        className={cn(
          "bg-surface-container-low flex flex-col items-center justify-center gap-1 rounded-xl border border-[rgba(0,0,0,0.06)] text-center",
          isFill
            ? "h-full w-full p-1"
            : "h-full min-h-[100px] w-full min-w-[200px] p-3",
          containerClassName,
        )}
      >
        {fallbackIcon || (
          <ImageIcon
            className={cn(
              "text-on-surface/30",
              isFill ? "h-3.5 w-3.5" : "h-8 w-8",
            )}
          />
        )}
        {!isFill && (attachmentId || src) && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setImgError(false);
              retry();
            }}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors hover:underline"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      {...containerProps}
      className={cn(
        "group bg-surface-container-low relative overflow-hidden rounded-xl border border-[rgba(0,0,0,0.06)]",
        isFill && "h-full w-full",
        isLoading && !isFill && "min-h-[160px] min-w-[200px]",
        containerClassName,
        containerProps?.className,
      )}
    >
      {/* Shimmer & Doughnut Loading UX Overlay */}
      {isLoading && !isPriority && (
        <div className="bg-surface-container-low/50 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
          <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Doughnut Spinner */}
          <div className="relative flex h-12 w-12 items-center justify-center">
            <svg
              className="text-primary absolute h-full w-full animate-spin"
              viewBox="0 0 50 50"
            >
              <circle
                className="opacity-25"
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <circle
                className="opacity-75"
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray="90 150"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}

      {/* File Size Badge */}
      {sizeBytes !== undefined && (
        <div className="absolute top-2 right-2 z-20 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
          {formatFileSize(sizeBytes)}
        </div>
      )}

      {objectUrl &&
        (isSvg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={objectUrl}
            alt={alt || "Image"}
            className={cn(
              "transition-all duration-300 ease-in-out",
              isFill
                ? "absolute inset-0 h-full w-full object-cover"
                : "h-auto w-full",
              onImageClick && "cursor-pointer hover:opacity-95",
              className,
            )}
            onClick={(e) => {
              if (onImageClick) {
                e.stopPropagation();
                onImageClick(objectUrl);
              }
            }}
            onLoad={(e) => {
              if (!isPriority) setImgLoading(false);
              props.onLoad?.(e as any);
            }}
            onError={async (e) => {
              const retrying = await handleImageError();
              if (retrying) {
                if (!isPriority) setImgLoading(true);
              } else {
                setImgError(true);
                if (!isPriority) setImgLoading(false);
                props.onError?.(e as any);
              }
            }}
          />
        ) : (
          <Image
            src={objectUrl}
            alt={alt || "Image"}
            unoptimized={props.unoptimized ?? (isBlob || isExternal)}
            className={cn(
              "object-cover transition-all duration-700 ease-in-out",
              isLoading && !isPriority
                ? "scale-105 blur-md grayscale-[50%]"
                : "blur-0 scale-100 grayscale-0",
              !isFill && "h-auto w-full",
              onImageClick && "cursor-pointer hover:opacity-95",
              className,
            )}
            onClick={(e) => {
              if (onImageClick) {
                e.stopPropagation();
                onImageClick(objectUrl);
              }
            }}
            onLoad={(e) => {
              if (!isPriority) setImgLoading(false);
              props.onLoad?.(e);
            }}
            onError={async (e) => {
              const retrying = await handleImageError();
              if (retrying) {
                if (!isPriority) setImgLoading(true);
              } else {
                setImgError(true);
                if (!isPriority) setImgLoading(false);
                props.onError?.(e);
              }
            }}
            {...(!isFill ? { width: 0, height: 0, sizes: "100vw" } : {})}
            {...props}
          />
        ))}
    </div>
  );
};

"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Terminal, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { useSecureImage } from "@/hooks/data/useSecureImage";

export interface OptimizedImageProps extends Omit<ImageProps, "src"> {
  src: string | null;
  sizeBytes?: number;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
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
  containerClassName,
  className,
  fallbackIcon,
  containerProps,
  sizeBytes,
  ...props
}: OptimizedImageProps) => {
  const isPriority = !!props.priority;

  const {
    objectUrl,
    loading: secureLoading,
    error: secureError,
  } = useSecureImage(src);

  const [imgLoading, setImgLoading] = useState(!isPriority);
  const [imgError, setImgError] = useState(false);

  const isLoading = secureLoading || imgLoading;
  const error = secureError || imgError;

  const isFill = !!props.fill;
  const isBlob = typeof objectUrl === "string" && objectUrl.startsWith("blob:");

  if (!src || error) {
    return (
      <div
        className={cn(
          "bg-surface-container-low flex h-full min-h-[100px] w-full items-center justify-center rounded-xl border border-[rgba(0,0,0,0.06)]",
          containerClassName,
        )}
      >
        {fallbackIcon || <ImageIcon className="text-on-surface/30 h-8 w-8" />}
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

      <Image
        src={objectUrl || ""}
        alt={alt || "Image"}
        unoptimized={isBlob}
        className={cn(
          "object-cover transition-all duration-700 ease-in-out",
          isLoading && !isPriority
            ? "scale-105 blur-md grayscale-[50%]"
            : "blur-0 scale-100 grayscale-0",
          !isFill && "h-auto w-full",
          className,
        )}
        onLoad={(e) => {
          if (!isPriority) setImgLoading(false);
          props.onLoad?.(e);
        }}
        onError={(e) => {
          setImgError(true);
          if (!isPriority) setImgLoading(false);
          props.onError?.(e);
        }}
        {...(!isFill ? { width: 0, height: 0, sizes: "100vw" } : {})}
        {...props}
      />
    </div>
  );
};

"use client";

import { cn } from "@/lib/utils";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { memo } from "react";

export interface TextShimmerProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number | string;
  color?: string;
  angle?: number;
  once?: boolean;
  reverse?: boolean;
}

const ShimmerComponent = ({
  children,
  as: Component = "p",
  className,
  duration,
  spread,
  color,
  angle,
  once,
  reverse,
  style,
  ...props
}: TextShimmerProps) => {
  const dynamicStyles: Record<string, string> = {
    ...(style as Record<string, string>),
  };

  if (duration !== undefined) {
    const durationMs = duration < 50 ? `${duration * 1000}ms` : `${duration}ms`;
    dynamicStyles["--shimmer-duration"] = durationMs;
  }

  if (spread !== undefined) {
    dynamicStyles["--shimmer-spread"] =
      typeof spread === "number" ? `${spread}px` : spread;
  }

  if (color !== undefined) {
    dynamicStyles["--shimmer-color"] = color;
  }

  if (angle !== undefined) {
    dynamicStyles["--shimmer-angle"] = `${angle}deg`;
  }

  return (
    <Component
      className={cn(
        "shimmer inline-block",
        once && "shimmer-once",
        reverse && "shimmer-reverse",
        className,
      )}
      style={Object.keys(dynamicStyles).length > 0 ? dynamicStyles : undefined}
      {...props}
    >
      {children}
    </Component>
  );
};

export const Shimmer = memo(ShimmerComponent);

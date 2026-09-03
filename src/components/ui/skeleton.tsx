import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "bg-muted/80 relative overflow-hidden rounded-md",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent",
        "dark:after:via-white/10",
        "after:animate-shimmer-slow",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };

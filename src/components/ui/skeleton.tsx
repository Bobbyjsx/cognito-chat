import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-[rgba(0,0,0,0.07)] dark:bg-white/[0.08]",
        "after:absolute after:-inset-x-full after:inset-y-0",
        "after:bg-gradient-to-r after:from-transparent after:via-white/90 after:to-transparent",
        "dark:after:via-white/20",
        "after:animate-shimmer-shine",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };

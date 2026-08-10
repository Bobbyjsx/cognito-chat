/**
 * IconTooltipButton
 *
 * A reusable icon-only button that shows a tooltip on hover.
 * Composes the existing Tooltip + Button primitives.
 *
 * Usage:
 *   <IconTooltipButton label="New chat" side="right" onClick={...}>
 *     <SquarePen className="h-5 w-5" />
 *   </IconTooltipButton>
 */

"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export interface IconTooltipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tooltip label text */
  label: string;
  /** Optional keyboard shortcut shown in the tooltip */
  shortcut?: string;
  /** Tooltip placement — defaults to "right" for sidebar usage */
  side?: ComponentProps<typeof TooltipContent>["side"];
  children: React.ReactNode;
}

export function IconTooltipButton({
  label,
  shortcut,
  side = "right",
  className,
  children,
  ...props
}: IconTooltipButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <button
            aria-label={label}
            className={cn(
              "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
              className,
            )}
            {...props}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <kbd className="bg-muted/80 text-muted-foreground pointer-events-none rounded px-1.5 py-0.5 font-mono text-[10px] font-medium select-none">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

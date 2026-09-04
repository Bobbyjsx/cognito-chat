"use client";

import { Menu } from "@base-ui/react/menu";
import { EllipsisVertical, Loader2, Share2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSessionActionsMenuProps {
  onShare: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  triggerClassName?: string;
  contentClassName?: string;
  /** Icon-only (sidebar) vs header control. */
  variant?: "icon" | "header";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChatSessionActionsMenu({
  onShare,
  onDelete,
  isDeleting = false,
  disabled = false,
  align = "end",
  side = "bottom",
  triggerClassName,
  contentClassName,
  variant = "icon",
  open,
  onOpenChange,
}: ChatSessionActionsMenuProps) {
  const isIcon = variant === "icon";

  return (
    <Menu.Root open={open} onOpenChange={onOpenChange}>
      <Menu.Trigger
        disabled={disabled || isDeleting}
        className={cn(
          "inline-flex items-center justify-center outline-none select-none",
          "rounded-full transition-[transform,background-color,color] duration-100 ease-out",
          "active:scale-[0.92]",
          "focus-visible:ring-foreground/15 focus-visible:ring-2",
          "disabled:pointer-events-none disabled:opacity-40",
          isIcon
            ? "text-muted-foreground/50 hover:bg-foreground/[0.06] hover:text-foreground size-6"
            : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground size-8",
          triggerClassName,
        )}
        aria-label="Conversation actions"
        title="Conversation actions"
      >
        {isDeleting ? (
          <Loader2
            className={cn("animate-spin", isIcon ? "size-3.5" : "size-4")}
          />
        ) : (
          <EllipsisVertical
            className={cn(isIcon ? "size-3.5" : "size-4")}
            strokeWidth={2}
          />
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner
          className="isolate z-50 outline-none"
          align={align}
          side={side}
          sideOffset={6}
        >
          <Menu.Popup
            className={cn(
              "origin-(--transform-origin) outline-none",
              "min-w-[9.75rem] rounded-[12px] p-1",
              // Apple-like material
              "bg-background/78 text-foreground backdrop-blur-2xl backdrop-saturate-150",
              "ring-1 ring-black/[0.06] dark:ring-white/[0.09]",
              "shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]",
              "dark:bg-background/72 dark:shadow-[0_10px_32px_rgba(0,0,0,0.5)]",
              // Fluid, interruptible enter/exit — starts fast, settles soft
              "transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "data-starting-style:scale-[0.96] data-starting-style:opacity-0",
              "data-ending-style:scale-[0.96] data-ending-style:opacity-0",
              "data-ending-style:duration-100",
              "motion-reduce:transition-none motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100",
              contentClassName,
            )}
          >
            <Menu.Item
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-[7px]",
                "text-foreground/90 text-[13px] font-medium tracking-[-0.01em]",
                "outline-none select-none",
                "transition-colors duration-75",
                "data-highlighted:bg-foreground/[0.06] data-highlighted:text-foreground",
                "[&_svg]:text-foreground/50 [&_svg]:size-[15px] [&_svg]:shrink-0",
              )}
              onClick={() => onShare()}
            >
              <Share2 strokeWidth={1.75} />
              Share
            </Menu.Item>

            <Menu.Separator className="bg-foreground/[0.06] mx-1.5 my-1 h-px" />

            <Menu.Item
              disabled={isDeleting}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-[7px]",
                "text-destructive text-[13px] font-medium tracking-[-0.01em]",
                "outline-none select-none",
                "transition-colors duration-75",
                "data-highlighted:bg-destructive/[0.08] data-highlighted:text-destructive",
                "data-disabled:pointer-events-none data-disabled:opacity-45",
                "[&_svg]:size-[15px] [&_svg]:shrink-0",
              )}
              onClick={() => onDelete()}
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" strokeWidth={1.75} />
              ) : (
                <Trash2 strokeWidth={1.75} />
              )}
              Delete
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

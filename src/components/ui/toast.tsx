"use client";

import * as React from "react";
import {
  Toast as ToastPrimitive,
  type ToastObject,
  type ToastManagerAddOptions,
  type ToastManagerUpdateOptions,
} from "@base-ui/react/toast";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  XIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const baseToast = ToastPrimitive.createToastManager();

export type ToastOptions = Omit<
  ToastObject<object>,
  "id" | "animation" | "height" | "ref" | "limited" | "updateKey"
> & {
  id?: string;
  duration?: number;
  action?: {
    label: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
};

type ToastInput = React.ReactNode | ToastOptions;

function normalizeToastOptions(
  input: ToastInput,
  options?: Omit<ToastOptions, "title">,
  type?: "success" | "info" | "warning" | "error" | "loading",
): ToastManagerAddOptions<object> {
  let merged: ToastOptions = {};
  if (
    typeof input === "object" &&
    input !== null &&
    !React.isValidElement(input) &&
    !Array.isArray(input)
  ) {
    merged = { ...(input as ToastOptions) };
  } else {
    merged = { title: input, ...options };
  }

  if (type) {
    merged.type = type;
  }

  const { duration, action, timeout, actionProps, ...rest } = merged;

  const finalTimeout = timeout ?? duration;
  const finalActionProps =
    actionProps ??
    (action
      ? {
          children: action.label,
          onClick: action.onClick,
        }
      : undefined);

  return {
    ...rest,
    timeout: finalTimeout,
    actionProps: finalActionProps,
  };
}

export interface ToastFn {
  (input: ToastInput, options?: Omit<ToastOptions, "title">): string;
  add: (options: ToastManagerAddOptions<object>) => string;
  close: (id?: string) => void;
  dismiss: (id?: string) => void;
  update: (id: string, updates: ToastManagerUpdateOptions<object>) => void;
  promise: typeof baseToast.promise;
  success: (input: ToastInput, options?: Omit<ToastOptions, "title">) => string;
  error: (input: ToastInput, options?: Omit<ToastOptions, "title">) => string;
  info: (input: ToastInput, options?: Omit<ToastOptions, "title">) => string;
  warning: (input: ToastInput, options?: Omit<ToastOptions, "title">) => string;
  loading: (input: ToastInput, options?: Omit<ToastOptions, "title">) => string;
}

const toast: ToastFn = Object.assign(
  (input: ToastInput, options?: Omit<ToastOptions, "title">) => {
    return baseToast.add(normalizeToastOptions(input, options));
  },
  {
    add: (options: ToastManagerAddOptions<object>) => baseToast.add(options),
    close: (id?: string) => baseToast.close(id),
    dismiss: (id?: string) => baseToast.close(id),
    update: (id: string, updates: ToastManagerUpdateOptions<object>) =>
      baseToast.update(id, updates),
    promise: baseToast.promise.bind(baseToast),
    success: (input: ToastInput, options?: Omit<ToastOptions, "title">) =>
      baseToast.add(normalizeToastOptions(input, options, "success")),
    error: (input: ToastInput, options?: Omit<ToastOptions, "title">) =>
      baseToast.add(normalizeToastOptions(input, options, "error")),
    info: (input: ToastInput, options?: Omit<ToastOptions, "title">) =>
      baseToast.add(normalizeToastOptions(input, options, "info")),
    warning: (input: ToastInput, options?: Omit<ToastOptions, "title">) =>
      baseToast.add(normalizeToastOptions(input, options, "warning")),
    loading: (input: ToastInput, options?: Omit<ToastOptions, "title">) =>
      baseToast.add(normalizeToastOptions(input, options, "loading")),
  },
);

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full",
        className,
      )}
      {...props}
    />
  );
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group/toast border-border/80 bg-popover/95 text-popover-foreground focus-visible:border-ring focus-visible:ring-ring/50 pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-2xl border p-0 shadow-lg backdrop-blur-md will-change-transform outline-none select-none focus-visible:ring-[3px]",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "data-limited:opacity-0 data-starting-style:[transform:translateY(150%)]",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]",
        "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        className,
      )}
      {...props}
    />
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex h-full items-center gap-3 overflow-hidden px-4 py-3.5 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn(
        "text-foreground text-xs leading-tight font-semibold",
        className,
      )}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-muted-foreground text-xs leading-snug", className)}
      {...props}
    />
  );
}

function ToastAction({
  className,
  render = (
    <Button
      variant="outline"
      size="sm"
      className="h-7 cursor-pointer px-2.5 text-xs font-medium"
    />
  ),
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

function ToastClose({
  className,
  children,
  render = (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground/80 hover:text-foreground size-6 cursor-pointer"
    />
  ),
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "hover:text-foreground relative shrink-0 rounded-md after:absolute after:-inset-1.5 after:content-[''] focus:outline-none",
        className,
      )}
      {...props}
    >
      {children ?? <XIcon className="size-3.5" aria-hidden="true" />}
    </ToastPrimitive.Close>
  );
}

function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode = null;

  if (type === "success") {
    icon = (
      <CircleCheckIcon
        className="size-4 text-emerald-600 dark:text-emerald-400"
        aria-hidden="true"
      />
    );
  }

  if (type === "info") {
    icon = (
      <InfoIcon
        className="size-4 text-sky-600 dark:text-sky-400"
        aria-hidden="true"
      />
    );
  }

  if (type === "warning") {
    icon = (
      <TriangleAlertIcon
        className="size-4 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
    );
  }

  if (type === "error") {
    icon = (
      <OctagonXIcon className="text-destructive size-4" aria-hidden="true" />
    );
  }

  if (type === "loading") {
    icon = (
      <Loader2Icon
        className="text-muted-foreground size-4 animate-spin"
        aria-hidden="true"
      />
    );
  }

  if (!icon) {
    return null;
  }

  return (
    <span
      data-slot="toast-icon"
      className="flex shrink-0 items-center justify-center [&_svg]:pointer-events-none"
    >
      {icon}
    </span>
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}

function Toaster({
  children,
  toastManager = baseToast,
  ...props
}: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
};

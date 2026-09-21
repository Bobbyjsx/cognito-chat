"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlanComparisonCards } from "@/components/modules/billing/PlanComparisonCards";
import type { PlanTier } from "@/lib/plans";

type PaywallDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: "quota" | "upgrade";
  highlightPlan?: PlanTier;
};

export function PaywallDialog({
  open,
  onOpenChange,
  reason = "upgrade",
  highlightPlan = "premium",
}: PaywallDialogProps) {
  const title =
    reason === "quota" ? "You've reached your usage limit" : "Upgrade Cognito";
  const description =
    reason === "quota"
      ? "Upgrade for higher usage limits, or wait until your allowance resets."
      : "One subscription. Every frontier model. Cancel anytime.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90dvh] w-full max-w-[calc(100%-1.5rem)] flex-col overflow-hidden p-0 sm:max-w-2xl sm:rounded-2xl"
        showCloseButton
      >
        {/* Pinned Sticky Header */}
        <DialogHeader className="shrink-0 border-b border-[#EAEAEA] px-5 pt-5 pr-12 pb-4 dark:border-white/10">
          <DialogTitle className="text-base font-bold tracking-tight text-[#111111] sm:text-lg dark:text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#787774] dark:text-neutral-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Plan Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          <PlanComparisonCards
            highlightPlan={highlightPlan}
            showMobileToggle={true}
            showSecurityDisclaimer={true}
            className="pb-2"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Check, Zap } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import {
  openCheckoutUrl,
  useCheckout,
  usePlans,
} from "@/hooks/data/useBilling";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import {
  PAID_PLANS,
  PLAN_HIERARCHY,
  formatNgn,
  isPaidTier,
  normalizeTier,
  type PlanTier,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

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
  const { data: profile } = useProfile();
  const { data: plans } = usePlans({ enabled: open });
  const checkout = useCheckout();
  const [pendingTier, setPendingTier] = useState<string | null>(null);

  const currentTier = normalizeTier(profile?.tier);
  const currentIsPaid =
    isPaidTier(profile?.tier) &&
    (profile?.subscriptionStatus === "active" ||
      Boolean(profile?.isSubscribed));

  const handleSubscribe = async (tier: string) => {
    if (currentTier === tier && currentIsPaid) return;
    setPendingTier(tier);
    try {
      const data = await checkout.mutateAsync(tier);
      openCheckoutUrl(data.checkoutUrl);
      setPendingTier(null);
    } catch {
      setPendingTier(null);
      toast.error("Failed to start checkout. Please try again.");
    }
  };

  const title =
    reason === "quota" ? "You've reached your usage limit" : "Upgrade Cognito";
  const description =
    reason === "quota"
      ? "Upgrade for higher usage limits, or wait until your allowance resets."
      : "One subscription. Every frontier model. Cancel anytime.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PAID_PLANS.map((plan) => {
            const apiPlan = plans?.find((p) => p.tier === plan.id);
            const amount = apiPlan?.amount ?? plan.priceNgn;
            const isCurrent = currentIsPaid && currentTier === plan.id;
            const isDowngrade =
              currentIsPaid &&
              PLAN_HIERARCHY[plan.id] < PLAN_HIERARCHY[currentTier];
            const isHighlight = plan.id === highlightPlan && !isCurrent;

            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-xl border p-4",
                  isHighlight
                    ? "border-[#111111] bg-white"
                    : "border-[rgba(0,0,0,0.08)] bg-white",
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider uppercase">
                    {plan.name}
                  </span>
                  {plan.id === "premium" && (
                    <Zap className="size-3.5 fill-[#f0a500] text-[#f0a500]" />
                  )}
                </div>
                <div className="mb-1 flex items-end gap-1">
                  <span className="text-2xl font-extrabold tracking-tight">
                    {formatNgn(amount)}
                  </span>
                  <span className="mb-0.5 text-xs text-[#787774]">/ month</span>
                </div>
                <p className="mb-3 text-xs text-[#787774]">
                  {plan.usageHeadline}
                </p>
                <ul className="mb-4 flex-1 space-y-1.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-[#5a5a57]"
                    >
                      <Check className="mt-0.5 size-3 shrink-0 text-[#346538]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isHighlight ? "default" : "outline"}
                  disabled={isCurrent || isDowngrade || checkout.isPending}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {pendingTier === plan.id ? (
                    <Spinner className="size-4" />
                  ) : isCurrent ? (
                    "Current plan"
                  ) : isDowngrade ? (
                    "Included in your plan"
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

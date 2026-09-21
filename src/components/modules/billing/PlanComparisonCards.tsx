"use client";

import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
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
  normalizeTier,
  type PlanTier,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

export interface PlanComparisonCardsProps {
  currentTier?: PlanTier;
  isActivePaid?: boolean;
  isDowngradeScheduled?: boolean;
  targetTier?: string;
  highlightPlan?: PlanTier;
  onSubscribe?: (planId: string) => void | Promise<void>;
  onDowngrade?: (planId: string) => void;
  pendingTier?: string | null;
  isActionDisabled?: boolean;
  showMobileToggle?: boolean;
  showSecurityDisclaimer?: boolean;
  className?: string;
}

export function PlanComparisonCards({
  currentTier: propCurrentTier,
  isActivePaid: propIsActivePaid,
  isDowngradeScheduled = false,
  targetTier = "",
  highlightPlan = "premium",
  onSubscribe,
  onDowngrade,
  pendingTier: propPendingTier,
  isActionDisabled = false,
  showMobileToggle = true,
  showSecurityDisclaimer = true,
  className,
}: PlanComparisonCardsProps) {
  const { data: profile } = useProfile();
  const { data: plans } = usePlans();
  const defaultCheckout = useCheckout();

  const [internalPendingTier, setInternalPendingTier] = useState<string | null>(
    null,
  );
  const [mobileActiveTab, setMobileActiveTab] = useState<"go" | "premium">(
    highlightPlan === "go" ? "go" : "premium",
  );

  const pendingTier =
    propPendingTier !== undefined ? propPendingTier : internalPendingTier;

  // Determine current tier from prop or profile
  const resolvedCurrentTier: PlanTier =
    propCurrentTier ?? normalizeTier(profile?.tier);

  const resolvedIsActivePaid: boolean =
    propIsActivePaid ??
    (resolvedCurrentTier !== "free" &&
      (profile?.subscriptionStatus === "active" ||
        Boolean(profile?.isSubscribed)));

  const handleSubscribeInternal = async (tier: string) => {
    if (onSubscribe) {
      onSubscribe(tier);
      return;
    }

    setInternalPendingTier(tier);
    try {
      const data = await defaultCheckout.mutateAsync(tier);
      openCheckoutUrl(data.checkoutUrl);
    } catch {
      setInternalPendingTier(null);
      toast.error("Failed to start checkout. Please try again.");
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Plan Toggle Selector */}
      {showMobileToggle && (
        <div className="mb-3.5 flex items-center justify-between sm:hidden">
          <span className="text-xs font-semibold text-[#111111] dark:text-white">
            Select Plan
          </span>
          <div className="inline-flex rounded-lg border border-[#EAEAEA] bg-[#F7F6F3] p-0.5 dark:border-white/10 dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => setMobileActiveTab("go")}
              className={cn(
                "rounded-md px-3.5 py-1 text-xs font-medium transition-all",
                mobileActiveTab === "go"
                  ? "bg-white font-semibold text-[#111111] shadow-2xs dark:bg-neutral-900 dark:text-white"
                  : "text-[#787774] hover:text-[#111111] dark:text-neutral-400 dark:hover:text-white",
              )}
            >
              Go
            </button>
            <button
              type="button"
              onClick={() => setMobileActiveTab("premium")}
              className={cn(
                "rounded-md px-3.5 py-1 text-xs font-medium transition-all",
                mobileActiveTab === "premium"
                  ? "bg-white font-semibold text-[#111111] shadow-2xs dark:bg-neutral-900 dark:text-white"
                  : "text-[#787774] hover:text-[#111111] dark:text-neutral-400 dark:hover:text-white",
              )}
            >
              Premium
            </button>
          </div>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PAID_PLANS.map((plan) => {
          const apiPlan = plans?.find((p) => p.tier === plan.id);
          const amount = apiPlan?.amount ?? plan.priceNgn;
          const isCurrent =
            resolvedCurrentTier === plan.id && resolvedIsActivePaid;
          const isHighlight = highlightPlan === plan.id && !isCurrent;

          const isDowngrade =
            resolvedIsActivePaid &&
            PLAN_HIERARCHY[plan.id] < PLAN_HIERARCHY[resolvedCurrentTier];

          const isUpgrade =
            resolvedIsActivePaid &&
            PLAN_HIERARCHY[plan.id] > PLAN_HIERARCHY[resolvedCurrentTier];

          const isScheduledDowngradeTarget =
            isDowngradeScheduled && targetTier === plan.id;

          const isHiddenOnMobile =
            showMobileToggle && mobileActiveTab !== plan.id
              ? "hidden sm:flex"
              : "flex";

          const disabled =
            isActionDisabled ||
            Boolean(pendingTier) ||
            defaultCheckout.isPending ||
            isDowngradeScheduled;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex-col justify-between overflow-visible border bg-white p-4.5 shadow-2xs transition-all sm:p-6 dark:bg-[#18181b]",
                isHiddenOnMobile,
                isHighlight
                  ? "border-[#111111] ring-1 ring-[#111111] dark:border-white dark:ring-white"
                  : "border-[#EAEAEA] dark:border-white/10",
              )}
            >
              {plan.id === "premium" && (
                <div className="absolute top-0 right-5 z-10 rounded-t-none rounded-b-md bg-[#111111] px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-xs dark:bg-white dark:text-[#111111]">
                  Recommended
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5 pr-24">
                  <span className="text-xs font-bold tracking-wider text-[#111111] uppercase dark:text-white">
                    {plan.name}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl dark:text-white">
                    {formatNgn(amount)}
                  </span>
                  <span className="text-xs text-[#787774] dark:text-neutral-400">
                    / month
                  </span>
                </div>

                <p className="mt-1.5 text-xs leading-relaxed text-[#787774] dark:text-neutral-400">
                  {plan.usageHeadline}
                </p>

                <div className="my-4 h-px bg-[#EAEAEA] dark:bg-white/10" />

                <ul className="space-y-2.5 text-xs">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 leading-tight text-[#222222] dark:text-neutral-200"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-[2.5] text-emerald-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-2">
                {isCurrent ? (
                  <Button disabled className="w-full text-xs font-medium">
                    Current Plan
                  </Button>
                ) : isScheduledDowngradeTarget ? (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full text-xs font-medium"
                  >
                    Downgrade Scheduled
                  </Button>
                ) : isDowngrade ? (
                  onDowngrade ? (
                    <Button
                      variant="outline"
                      className="w-full text-xs font-medium"
                      onClick={() => onDowngrade(plan.id)}
                      disabled={disabled}
                    >
                      Downgrade to {plan.name}
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full text-xs font-medium"
                    >
                      Included in your plan
                    </Button>
                  )
                ) : isUpgrade ? (
                  <Button
                    variant={isHighlight ? "default" : "outline"}
                    className="w-full text-xs font-semibold"
                    onClick={() => handleSubscribeInternal(plan.id)}
                    disabled={disabled}
                  >
                    {pendingTier === plan.id ? (
                      <>
                        <Spinner className="mr-1.5 h-3.5 w-3.5" />
                        Upgrading...
                      </>
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </Button>
                ) : (
                  <Button
                    variant={isHighlight ? "default" : "outline"}
                    className="w-full text-xs font-semibold"
                    onClick={() => handleSubscribeInternal(plan.id)}
                    disabled={disabled}
                  >
                    {pendingTier === plan.id ? (
                      <>
                        <Spinner className="mr-1.5 h-3.5 w-3.5" />
                        Redirecting...
                      </>
                    ) : (
                      `Subscribe to ${plan.name}`
                    )}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Security and Billing Disclaimer Snippet */}
      {showSecurityDisclaimer && (
        <div className="mt-4 rounded-xl border border-[#EAEAEA] bg-[#FBFBFA] p-3.5 text-xs dark:border-white/10 dark:bg-neutral-900/40">
          <div className="flex items-center gap-2 font-medium text-[#111111] dark:text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            <span>Secure Payments via Paystack</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#787774] dark:text-neutral-400">
            Card, bank transfer, and USSD supported. Subscriptions renew
            automatically every 30 days and can be cancelled at any time without
            penalty.
          </p>
        </div>
      )}
    </div>
  );
}

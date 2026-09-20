"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, Zap } from "lucide-react";
import {
  useBillingStatus,
  usePlans,
  useCheckout,
  useVerifySubscription,
  useCancelSubscription,
  useDowngradeSubscription,
  useCancelDowngrade,
  openCheckoutUrl,
} from "@/hooks/data/useBilling";
import { BillingPageLoading } from "@/components/loading/page-skeletons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { Navbar } from "@/components/modules/chat/Navbar";
import { ChatSidebar } from "@/components/modules/chat/ChatSidebar";
import {
  PAID_PLANS,
  PLAN_HIERARCHY,
  formatNgn,
  normalizeTier,
  type PlanTier,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

function BillingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPlan = normalizeTier(searchParams.get("plan"));
  const checkoutRef =
    searchParams.get("reference") || searchParams.get("trxref");
  const {
    data: status,
    isLoading: statusLoading,
    isFetching: statusFetching,
    refetch: refetchBilling,
  } = useBillingStatus();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const checkout = useCheckout();
  const verifySub = useVerifySubscription();
  const cancel = useCancelSubscription();
  const downgrade = useDowngradeSubscription();
  const cancelDowngrade = useCancelDowngrade();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [pendingTier, setPendingTier] = React.useState<string | null>(null);
  const verifiedRef = React.useRef<string | null>(null);

  const isVerifying = Boolean(checkoutRef);

  useEffect(() => {
    if (!checkoutRef || verifiedRef.current === checkoutRef) return;
    verifiedRef.current = checkoutRef;

    verifySub.mutate(checkoutRef, {
      onSuccess: () => {
        toast.success("Payment verified! Your plan has been updated.");
        void refetchBilling();
        router.replace("/settings/billing");
      },
      onError: (err) => {
        const detail =
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "data" in err.response
            ? (err.response as { data?: { detail?: string } }).data?.detail
            : null;
        toast.error(
          detail || "Payment verification could not be confirmed immediately.",
        );
        void refetchBilling();
      },
    });
  }, [checkoutRef, refetchBilling, router, verifySub]);

  if (isVerifying) {
    return (
      <div className="bg-background font-body-md text-body-md text-on-surface flex h-full w-full overflow-hidden">
        <ChatSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <main className="bg-background relative flex h-full min-w-0 flex-1 flex-col">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-12 sm:px-6 md:py-20">
              <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-8 text-center shadow-xs md:p-12">
                {verifySub.isError ? (
                  <>
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                      <AlertCircle className="size-7" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-[#111111]">
                      Verification pending
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
                      We couldn&apos;t immediately confirm your payment with
                      Paystack. If your account was debited, your plan will
                      activate automatically once the provider webhook arrives.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => router.replace("/settings/billing")}
                      >
                        Continue to Billing
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#111111]/5">
                      <Spinner className="size-7 text-[#111111]" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-[#111111]">
                      Verifying your payment...
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
                      Please hold on while we confirm your transaction and
                      update your subscription. This should only take a moment.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] px-3.5 py-1 text-xs text-[#787774]">
                      <span>Reference:</span>
                      <span className="font-mono font-medium text-[#111111]">
                        {checkoutRef}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentTier: PlanTier = normalizeTier(status?.tier);
  const isActivePaid =
    currentTier !== "free" &&
    (status?.status === "active" || status?.status === "cancelled");

  const scheduledChange = status?.scheduledChange || status?.scheduled_change;
  const targetTier = (
    scheduledChange?.targetTier ||
    scheduledChange?.target_tier ||
    ""
  ).toLowerCase();
  const effectiveAt =
    scheduledChange?.effectiveAt || scheduledChange?.effective_at;
  const isDowngradeScheduled =
    scheduledChange?.status?.toLowerCase() === "pending";
  const periodEnd = status?.currentPeriodEnd || status?.current_period_end;
  const cancelAtEnd = status?.cancelAtPeriodEnd ?? status?.cancel_at_period_end;

  const highlight =
    requestedPlan === "go" || requestedPlan === "premium"
      ? requestedPlan
      : "premium";

  if (statusLoading || plansLoading) {
    return <BillingPageLoading />;
  }

  const handleSubscribe = async (planTier: string) => {
    setPendingTier(planTier);
    try {
      const data = await checkout.mutateAsync(planTier);
      openCheckoutUrl(data.checkoutUrl);
    } catch {
      setPendingTier(null);
      toast.error("Failed to initialize checkout");
    }
  };

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync();
      toast.success("Subscription will cancel at period end");
    } catch (err) {
      const detail =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
          ? (err.response as { data?: { detail?: string } }).data?.detail
          : null;
      toast.error(detail || "Failed to cancel subscription");
    }
  };

  const handleDowngrade = async (planTier: string) => {
    try {
      await downgrade.mutateAsync(planTier);
      toast.success(`Successfully scheduled downgrade to ${planTier}`);
    } catch (err) {
      const detail =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
          ? (err.response as { data?: { detail?: string } }).data?.detail
          : null;
      toast.error(detail || "Failed to schedule downgrade");
    }
  };

  const handleCancelDowngrade = async () => {
    try {
      await cancelDowngrade.mutateAsync();
      toast.success("Successfully cancelled scheduled downgrade");
    } catch (err) {
      const detail =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
          ? (err.response as { data?: { detail?: string } }).data?.detail
          : null;
      toast.error(detail || "Failed to cancel downgrade");
    }
  };

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface flex h-full w-full overflow-hidden">
      <ChatSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="bg-background relative flex h-full min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 md:py-10">
            <div>
              <Link
                href="/settings"
                className="text-gray-medium hover:bg-surface-container hover:text-on-surface mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Settings
              </Link>
              <h1 className="text-headline-lg text-on-surface font-bold tracking-tight">
                Billing & plans
              </h1>
              <p className="text-body-md text-gray-medium mt-1">
                Usage limits apply on every generation. Upgrade for more
                headroom.
              </p>
            </div>

            <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold tracking-wider text-[#787774] uppercase">
                Current plan
              </p>
              <p className="mt-2 text-xl font-bold capitalize">
                Cognito {currentTier}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Status:{" "}
                <span className="font-medium capitalize">
                  {currentTier === "free" ? "free" : status?.status || "free"}
                </span>
                {" · "}
                {currentTier === "premium"
                  ? "1.5× higher usage limits than Go"
                  : currentTier === "go"
                    ? "Usage built for everyday work"
                    : "Starter usage allowance"}
              </p>
              {periodEnd && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Current period ends {new Date(periodEnd).toLocaleDateString()}
                </p>
              )}
              {cancelAtEnd && (
                <p className="mt-2 text-sm text-yellow-600">
                  Your subscription is set to cancel at the end of the billing
                  period.
                </p>
              )}
              {isActivePaid &&
                status?.status === "active" &&
                !cancelAtEnd &&
                !isDowngradeScheduled && (
                  <Button
                    variant="destructive"
                    className="mt-4"
                    onClick={handleCancel}
                    disabled={cancel.isPending}
                  >
                    {cancel.isPending ? "Cancelling..." : "Cancel subscription"}
                  </Button>
                )}
            </div>

            {isDowngradeScheduled && (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
                <p className="text-xs font-semibold tracking-wider text-yellow-800 uppercase">
                  Scheduled Downgrade
                </p>
                <p className="mt-2 text-sm text-yellow-900">
                  Your plan will downgrade to{" "}
                  <span className="font-semibold capitalize">
                    Cognito {targetTier || "go"}
                  </span>{" "}
                  on{" "}
                  {effectiveAt
                    ? new Date(effectiveAt).toLocaleDateString()
                    : "next billing date"}
                  .
                </p>
                <Button
                  variant="outline"
                  className="mt-4 border-yellow-300 text-yellow-900 hover:bg-yellow-100"
                  onClick={handleCancelDowngrade}
                  disabled={cancelDowngrade.isPending || statusFetching}
                >
                  {cancelDowngrade.isPending
                    ? "Cancelling..."
                    : "Cancel Downgrade"}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {PAID_PLANS.map((plan) => {
                const apiPlan = plans?.find((p) => p.tier === plan.id);
                const amount = apiPlan?.amount ?? plan.priceNgn;
                const isCurrent = currentTier === plan.id && isActivePaid;
                const isHighlight = highlight === plan.id && !isCurrent;

                // Determine if this plan is a downgrade from current
                const isDowngrade =
                  isActivePaid &&
                  PLAN_HIERARCHY[plan.id] < PLAN_HIERARCHY[currentTier];

                // Determine if this plan is an upgrade from current
                const isUpgrade =
                  isActivePaid &&
                  PLAN_HIERARCHY[plan.id] > PLAN_HIERARCHY[currentTier];

                // Determine if this plan is the target of a scheduled downgrade
                const isScheduledDowngradeTarget =
                  isDowngradeScheduled && targetTier === plan.id;

                const isActionDisabled =
                  checkout.isPending ||
                  downgrade.isPending ||
                  cancelDowngrade.isPending ||
                  statusFetching;

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm",
                      isHighlight
                        ? "border-[#111111]"
                        : "border-[rgba(0,0,0,0.08)]",
                    )}
                  >
                    {plan.id === "premium" && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#111111] px-3 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
                        Most popular
                      </div>
                    )}
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-xs font-bold tracking-wider uppercase">
                        {plan.name}
                      </span>
                      {plan.id === "premium" && (
                        <Zap className="size-3.5 fill-[#f0a500] text-[#f0a500]" />
                      )}
                    </div>
                    <div className="flex items-end gap-1.5">
                      <span className="text-3xl font-extrabold">
                        {formatNgn(amount)}
                      </span>
                      <span className="mb-1 text-sm text-[#787774]">
                        / month
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#787774]">
                      {plan.usageHeadline}
                    </p>
                    <ul className="mt-4 mb-6 flex-1 space-y-2">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-[#5a5a57]"
                        >
                          <Check className="mt-0.5 size-3.5 shrink-0 text-[#346538]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Button disabled className="w-full">
                        Current plan
                      </Button>
                    ) : isScheduledDowngradeTarget ? (
                      <Button disabled variant="outline" className="w-full">
                        Downgrade Scheduled
                      </Button>
                    ) : isDowngrade ? (
                      <Button
                        variant={isHighlight ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handleDowngrade(plan.id)}
                        disabled={isActionDisabled || isDowngradeScheduled}
                      >
                        {downgrade.isPending ? (
                          <>
                            <Spinner className="mr-2 size-4" />
                            Scheduling...
                          </>
                        ) : (
                          `Downgrade to ${plan.name}`
                        )}
                      </Button>
                    ) : isUpgrade ? (
                      <Button
                        variant={isHighlight ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isActionDisabled || isDowngradeScheduled}
                      >
                        {pendingTier === plan.id && checkout.isPending ? (
                          <>
                            <Spinner className="mr-2 size-4" />
                            Upgrading...
                          </>
                        ) : (
                          `Upgrade to ${plan.name}`
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant={isHighlight ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isActionDisabled || isDowngradeScheduled}
                      >
                        {pendingTier === plan.id && checkout.isPending ? (
                          <>
                            <Spinner className="mr-2 size-4" />
                            Redirecting...
                          </>
                        ) : (
                          `Subscribe to ${plan.name}`
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingPageLoading />}>
      <BillingPageInner />
    </Suspense>
  );
}

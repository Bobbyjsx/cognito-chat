"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, AlertTriangle, ArrowLeft, Calendar } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { Navbar } from "@/components/modules/chat/Navbar";
import { ChatSidebar } from "@/components/modules/chat/ChatSidebar";
import { BottomNav } from "@/components/modules/settings/BottomNav";
import { PlanComparisonCards } from "@/components/modules/billing/PlanComparisonCards";
import { normalizeTier, type PlanTier } from "@/lib/plans";

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
  const { isLoading: plansLoading } = usePlans();

  const checkout = useCheckout();
  const verifySub = useVerifySubscription();
  const cancel = useCancelSubscription();
  const downgrade = useDowngradeSubscription();
  const cancelDowngrade = useCancelDowngrade();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingTier, setPendingTier] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelDowngradeModalOpen, setCancelDowngradeModalOpen] =
    useState(false);
  const [downgradeModalPlan, setDowngradeModalPlan] = useState<string | null>(
    null,
  );

  const verifiedRef = useRef<string | null>(null);
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

  // Verification loading or error view
  if (isVerifying) {
    return (
      <div className="bg-background font-body-md text-body-md text-on-surface flex h-full w-full overflow-hidden">
        <ChatSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <main className="bg-background relative flex h-full min-w-0 flex-1 flex-col">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6 md:py-24">
              <Card className="border-[rgba(0,0,0,0.06)] bg-white p-8 text-center shadow-2xs">
                {verifySub.isError ? (
                  <>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <h2 className="text-on-surface text-lg font-bold tracking-tight">
                      Verification Pending
                    </h2>
                    <p className="text-gray-medium mx-auto mt-2 max-w-sm text-xs leading-relaxed">
                      We couldn&apos;t immediately confirm your payment with
                      Paystack. If your account was debited, your plan will
                      activate automatically once the webhook confirms.
                    </p>
                    <div className="mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.replace("/settings/billing")}
                        className="text-xs"
                      >
                        Return to Billing
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
                      <Spinner className="h-6 w-6 text-neutral-800" />
                    </div>
                    <h2 className="text-on-surface text-lg font-bold tracking-tight">
                      Confirming your subscription...
                    </h2>
                    <p className="text-gray-medium mx-auto mt-2 max-w-sm text-xs leading-relaxed">
                      Please hold on while we verify your transaction with
                      Paystack and update your account workspace.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-neutral-50 px-3.5 py-1 text-xs text-neutral-500">
                      <span>Reference:</span>
                      <span className="font-mono font-medium text-neutral-800">
                        {checkoutRef}
                      </span>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
          <BottomNav />
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

  const handleSubscribe = async (tierToSub: string) => {
    setPendingTier(tierToSub);
    try {
      const data = await checkout.mutateAsync(tierToSub);
      openCheckoutUrl(data.checkoutUrl);
    } catch {
      setPendingTier(null);
      toast.error("Failed to initialize checkout session");
    }
  };

  const handleConfirmCancel = async () => {
    try {
      await cancel.mutateAsync();
      toast.success(
        "Subscription scheduled to cancel at end of billing cycle.",
      );
      setCancelModalOpen(false);
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

  const handleConfirmDowngrade = async () => {
    if (!downgradeModalPlan) return;
    try {
      await downgrade.mutateAsync(downgradeModalPlan);
      toast.success(
        `Downgrade to ${downgradeModalPlan} scheduled for end of period.`,
      );
      setDowngradeModalPlan(null);
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
      toast.success("Scheduled downgrade successfully cancelled");
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
      toast.error(detail || "Failed to cancel scheduled downgrade");
    }
  };

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface flex h-full w-full overflow-hidden">
      <ChatSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      <main className="bg-background relative flex h-full min-w-0 flex-1 flex-col">
        {/* Mobile Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-28 sm:px-6 md:py-10 md:pb-12">
            {/* Context Header */}
            <div className="mb-6">
              <Link
                href="/settings"
                className="text-gray-medium hover:text-on-surface hover:bg-surface-container -ml-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Settings</span>
              </Link>
              <h1 className="text-headline-lg text-on-surface mt-2 font-bold tracking-tight">
                Billing & Plans
              </h1>
              <p className="text-gray-medium mt-1 text-sm">
                Manage your active subscription, upgrade allowances, and payment
                settings.
              </p>
            </div>

            {/* Current Plan Overview Card */}
            <Card className="mb-6 border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-2xs sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-medium text-[11px] font-semibold tracking-wider uppercase">
                      Current Plan
                    </span>
                    <Badge
                      variant="outline"
                      className="border-[rgba(0,0,0,0.08)] bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-700 capitalize"
                    >
                      {currentTier === "free"
                        ? "Free Tier"
                        : status?.status || "active"}
                    </Badge>
                  </div>
                  <h2 className="text-on-surface mt-1 text-xl font-bold capitalize">
                    Cognito {currentTier}
                  </h2>
                  <p className="text-gray-medium mt-1 text-xs">
                    {currentTier === "premium"
                      ? "Highest usage limits, custom instructions, and priority access."
                      : currentTier === "go"
                        ? "2× higher limits than Free across Claude, Gemini & GPT."
                        : "Starter usage allowance with rolling refresh windows."}
                  </p>
                  {periodEnd && (
                    <div className="text-gray-medium mt-2 flex items-center gap-1.5 text-xs">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Current cycle ends{" "}
                        {new Date(periodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {isActivePaid &&
                  status?.status === "active" &&
                  !cancelAtEnd &&
                  !isDowngradeScheduled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancelModalOpen(true)}
                      disabled={cancel.isPending}
                      className="border-error/20 text-error hover:bg-error/5 hover:text-error self-end text-xs sm:self-auto"
                    >
                      Cancel Subscription
                    </Button>
                  )}
              </div>

              {cancelAtEnd && (
                <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                    <span>Cancellation Pending</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                    Your subscription will end at the conclusion of your current
                    billing period. You will remain on {currentTier} until then.
                  </p>
                </div>
              )}
            </Card>

            {/* Scheduled Downgrade Notice */}
            {isDowngradeScheduled && (
              <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-2xs">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                      Scheduled Downgrade
                    </span>
                    <p className="text-on-surface mt-0.5 text-xs font-medium">
                      Your subscription will downgrade to{" "}
                      <span className="font-semibold capitalize">
                        Cognito {targetTier || "go"}
                      </span>{" "}
                      on{" "}
                      {effectiveAt
                        ? new Date(effectiveAt).toLocaleDateString()
                        : "the next billing date"}
                      .
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelDowngradeModalOpen(true)}
                    disabled={cancelDowngrade.isPending || statusFetching}
                    className="h-8 shrink-0 self-end text-xs sm:self-auto"
                  >
                    {cancelDowngrade.isPending ? (
                      <>
                        <Spinner className="mr-1.5 h-3.5 w-3.5" />
                        Cancelling...
                      </>
                    ) : (
                      "Cancel Downgrade"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Reusable Plan Comparison Cards & Security Disclaimer Module */}
            <PlanComparisonCards
              currentTier={currentTier}
              isActivePaid={isActivePaid}
              isDowngradeScheduled={isDowngradeScheduled}
              targetTier={targetTier}
              highlightPlan={highlight}
              onSubscribe={handleSubscribe}
              onDowngrade={(planId) => setDowngradeModalPlan(planId)}
              pendingTier={pendingTier}
              isActionDisabled={
                checkout.isPending ||
                downgrade.isPending ||
                cancelDowngrade.isPending ||
                statusFetching
              }
              showMobileToggle={true}
              showSecurityDisclaimer={true}
            />
          </div>
        </div>

        {/* Mobile Persistent Bottom Navigation Bar */}
        <BottomNav />
      </main>

      {/* Cancel Subscription Confirmation Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-base text-red-700 dark:text-red-400">
              Cancel Subscription?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              You will keep full access until{" "}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {periodEnd
                  ? new Date(periodEnd).toLocaleDateString()
                  : "the end of your billing cycle"}
              </span>
              . After that, your account reverts to the free tier and you will
              lose access to paid features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
              disabled={cancel.isPending}
              className="text-xs"
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={cancel.isPending}
              className="text-xs"
            >
              {cancel.isPending ? (
                <>
                  <Spinner className="mr-1.5 h-3.5 w-3.5" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade Confirmation Dialog */}
      <Dialog
        open={Boolean(downgradeModalPlan)}
        onOpenChange={(open) => !open && setDowngradeModalPlan(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-base text-amber-700 dark:text-amber-400">
              Downgrade to{" "}
              {downgradeModalPlan
                ? downgradeModalPlan.charAt(0).toUpperCase() +
                  downgradeModalPlan.slice(1)
                : "Go"}
              ?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              You will keep your current{" "}
              <span className="font-semibold text-neutral-900 capitalize dark:text-neutral-100">
                {currentTier}
              </span>{" "}
              plan and quotas until the end of this billing period. At renewal,
              your subscription automatically switches to the{" "}
              <span className="font-semibold text-neutral-900 capitalize dark:text-neutral-100">
                {downgradeModalPlan}
              </span>{" "}
              plan at the reduced rate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDowngradeModalPlan(null)}
              disabled={downgrade.isPending}
              className="text-xs"
            >
              Nevermind
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmDowngrade}
              disabled={downgrade.isPending}
              className="bg-amber-600 text-xs text-white hover:bg-amber-700 focus-visible:ring-amber-500/50 dark:bg-amber-700 dark:hover:bg-amber-600"
            >
              {downgrade.isPending ? (
                <>
                  <Spinner className="mr-1.5 h-3.5 w-3.5" />
                  Scheduling...
                </>
              ) : (
                "Confirm Downgrade"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Downgrade Confirmation Dialog */}
      <Dialog
        open={cancelDowngradeModalOpen}
        onOpenChange={setCancelDowngradeModalOpen}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-base text-red-700 dark:text-red-400">
              Cancel Scheduled Downgrade?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              This will remove the pending downgrade to{" "}
              <span className="font-semibold text-neutral-900 capitalize dark:text-neutral-100">
                {targetTier || "Go"}
              </span>
              . Your subscription will continue at your current{" "}
              <span className="font-semibold text-neutral-900 capitalize dark:text-neutral-100">
                {currentTier}
              </span>{" "}
              plan and billing rate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelDowngradeModalOpen(false)}
              disabled={cancelDowngrade.isPending}
              className="text-xs"
            >
              Keep Downgrade
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await handleCancelDowngrade();
                setCancelDowngradeModalOpen(false);
              }}
              disabled={cancelDowngrade.isPending}
              className="text-xs"
            >
              {cancelDowngrade.isPending ? (
                <>
                  <Spinner className="mr-1.5 h-3.5 w-3.5" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel It"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

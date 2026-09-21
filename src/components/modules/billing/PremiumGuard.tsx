"use client";

import React, { useState } from "react";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PaywallDialog } from "@/components/modules/billing/PaywallDialog";
import { useProfile } from "@/hooks/data/useAuth/useAuth";
import { normalizeTier, type PlanTier } from "@/lib/plans";
import { cn } from "@/lib/utils";

export interface PremiumGuardProps {
  children: React.ReactNode;
  /** Name of the premium feature being guarded (e.g. "Custom Instructions", "Prompt Library") */
  featureName?: string;
  /** Explanatory text for non-premium users */
  description?: string;
  /**
   * Display mode when user is not on Premium:
   * - "overlay": Renders children with reduced opacity/disabled interaction plus a lock overlay badge & upgrade CTA.
   * - "banner": Renders a locked banner card introducing the feature and prompting to upgrade.
   * - "action": Intercepts clicks on children to trigger the Paywall dialog.
   * - "inline": Renders children disabled with an attached lock badge.
   */
  mode?: "overlay" | "banner" | "action" | "inline";
  /** Optional custom fallback if standard modes are not sufficient */
  fallback?:
    React.ReactNode | ((props: { onUpgrade: () => void }) => React.ReactNode);
  /** Optional container className */
  className?: string;
}

export function usePremiumGuard() {
  const { data: profile, isLoading } = useProfile();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const tier: PlanTier = normalizeTier(profile?.tier);
  const isPremium = tier === "premium";

  const requirePremium = (callback?: () => void) => {
    if (!isPremium) {
      setPaywallOpen(true);
      return false;
    }
    callback?.();
    return true;
  };

  return {
    isPremium,
    tier,
    isLoading,
    paywallOpen,
    setPaywallOpen,
    requirePremium,
  };
}

export function PremiumGuard({
  children,
  featureName = "This feature",
  description = "Upgrade to Cognito Premium to unlock full access.",
  mode = "overlay",
  fallback,
  className,
}: PremiumGuardProps) {
  const { isPremium, isLoading, paywallOpen, setPaywallOpen } =
    usePremiumGuard();

  if (isLoading) {
    return (
      <div className={cn("w-full space-y-2", className)}>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  // If user is on premium, grant full unrestricted access
  if (isPremium) {
    return <>{children}</>;
  }

  const handleUpgrade = () => setPaywallOpen(true);

  // Custom fallback render
  if (fallback) {
    return (
      <>
        {typeof fallback === "function"
          ? fallback({ onUpgrade: handleUpgrade })
          : fallback}
        <PaywallDialog
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          reason="upgrade"
          highlightPlan="premium"
        />
      </>
    );
  }

  // Action mode: User sees the UI, but clicking it prompts the upgrade modal
  if (mode === "action") {
    return (
      <>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleUpgrade();
          }}
          className={cn("cursor-pointer", className)}
        >
          {children}
        </div>
        <PaywallDialog
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          reason="upgrade"
          highlightPlan="premium"
        />
      </>
    );
  }

  // Banner mode: Replaces UI with an informative locked banner card
  if (mode === "banner") {
    return (
      <>
        <Card
          className={cn(
            "relative overflow-hidden border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-5 shadow-xs",
            className,
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-800">
                  <Lock className="h-3.5 w-3.5" />
                </span>
                <h4 className="text-xs font-semibold text-neutral-900">
                  {featureName} (Premium)
                </h4>
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-800"
                >
                  Disabled on current plan
                </Badge>
              </div>
              <p className="max-w-lg text-xs text-neutral-600">{description}</p>
            </div>

            <Button
              size="sm"
              onClick={handleUpgrade}
              className="shrink-0 self-start text-xs font-medium sm:self-center"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Upgrade to Premium
            </Button>
          </div>
        </Card>

        <PaywallDialog
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          reason="upgrade"
          highlightPlan="premium"
        />
      </>
    );
  }

  // Inline mode: Children styled disabled with small locked badge
  if (mode === "inline") {
    return (
      <>
        <div
          className={cn(
            "relative inline-flex cursor-not-allowed items-center gap-2 opacity-60",
            className,
          )}
        >
          <div className="pointer-events-none">{children}</div>
          <Badge
            variant="outline"
            onClick={handleUpgrade}
            className="cursor-pointer border-amber-200 bg-amber-50 text-[10px] font-medium text-amber-800 transition-colors hover:bg-amber-100"
          >
            <Lock className="mr-1 inline h-3 w-3" />
            Premium
          </Badge>
        </div>
        <PaywallDialog
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          reason="upgrade"
          highlightPlan="premium"
        />
      </>
    );
  }

  // Overlay mode (default): Children rendered disabled underneath with a subtle lock overlay
  return (
    <>
      <div
        className={cn(
          "group/premium-guard relative overflow-hidden rounded-xl",
          className,
        )}
      >
        {/* Render children in disabled presentation so user sees it exists */}
        <div className="pointer-events-none opacity-50 blur-[0.4px] filter transition-all select-none">
          {children}
        </div>

        {/* Lock overlay banner */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/70 p-4 text-center backdrop-blur-[1.5px]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-800 shadow-xs">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-on-surface text-xs font-semibold">
                {featureName}
              </span>
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-800"
              >
                Premium Only
              </Badge>
            </div>
            <p className="text-gray-medium mt-0.5 max-w-xs text-[11px] leading-normal">
              {description}
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="mt-1 h-7.5 px-3 text-xs font-medium"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Upgrade to Unlock
            <ArrowRight className="ml-1.5 h-3 w-3" />
          </Button>
        </div>
      </div>

      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="upgrade"
        highlightPlan="premium"
      />
    </>
  );
}

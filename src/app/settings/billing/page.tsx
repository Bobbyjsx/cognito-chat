"use client";

import React from "react";
import {
  useBillingStatus,
  usePlans,
  useCheckout,
  useCancelSubscription,
} from "@/hooks/data/useBilling";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function BillingPage() {
  const { data: status, isLoading: statusLoading } = useBillingStatus();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const checkout = useCheckout();
  const cancel = useCancelSubscription();

  if (statusLoading || plansLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const handleSubscribe = async (planTier: string) => {
    try {
      const data = await checkout.mutateAsync(planTier);
      window.location.assign(data.authorization_url);
    } catch {
      toast.error("Failed to initialize checkout");
    }
  };

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync();
      toast.success("Subscription cancelled successfully");
    } catch {
      toast.error("Failed to cancel subscription");
    }
  };

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Billing & Subscriptions
        </h2>
        <p className="text-muted-foreground">
          Manage your subscription, view your plan details, and handle billing
          settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the{" "}
            <strong className="capitalize">{status?.tier || "Free"}</strong>{" "}
            plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            Status:{" "}
            <span className="font-medium capitalize">
              {status?.status || "free"}
            </span>
          </div>
          {status?.current_period_end && (
            <div className="text-muted-foreground mt-1 text-sm">
              Current period ends on:{" "}
              {new Date(status.current_period_end).toLocaleDateString()}
            </div>
          )}
          {status?.cancel_at_period_end && (
            <div className="mt-1 text-sm text-yellow-600 dark:text-yellow-500">
              Your subscription is set to cancel at the end of the billing
              period.
            </div>
          )}
        </CardContent>
        {status?.tier !== "free" &&
          status?.status === "active" &&
          !status?.cancel_at_period_end && (
            <CardFooter>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancel.isPending}
              >
                {cancel.isPending ? "Cancelling..." : "Cancel Subscription"}
              </Button>
            </CardFooter>
          )}
      </Card>

      <div className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
        {plans?.map((plan) => {
          const isCurrentPlan =
            status?.tier === plan.tier && status?.status === "active";
          return (
            <Card
              key={plan.id}
              className={isCurrentPlan ? "border-primary" : ""}
            >
              <CardHeader>
                <CardTitle className="capitalize">
                  Cognito {plan.tier}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">
                    ₦{plan.amount.toLocaleString()}
                  </span>{" "}
                  / {plan.interval}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Upgrade to {plan.tier} for advanced capabilities and higher
                  limits.
                </p>
              </CardContent>
              <CardFooter>
                {isCurrentPlan ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={checkout.isPending}
                  >
                    Subscribe to {plan.tier}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

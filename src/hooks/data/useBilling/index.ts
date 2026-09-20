import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface Plan {
  id: string;
  tier: string;
  interval: string;
  amount: number;
  currency: string;
}

export interface ScheduledChangeInfo {
  targetTier?: string;
  target_tier?: string;
  effectiveAt?: string;
  effective_at?: string;
  status: string;
}

export interface SubscriptionStatus {
  tier: string;
  status: string;
  interval: string;
  amount: number;
  currency: string;
  current_period_end?: string | null;
  currentPeriodEnd?: string | null;
  cancel_at_period_end?: boolean;
  cancelAtPeriodEnd?: boolean;
  scheduled_change?: ScheduledChangeInfo | null;
  scheduledChange?: ScheduledChangeInfo | null;
}

export const FALLBACK_PLANS: Plan[] = [
  {
    id: "go_monthly",
    tier: "go",
    interval: "monthly",
    amount: 5999,
    currency: "NGN",
  },
  {
    id: "premium_monthly",
    tier: "premium",
    interval: "monthly",
    amount: 9999,
    currency: "NGN",
  },
];

export const DEFAULT_BILLING_STATUS: SubscriptionStatus = {
  tier: "free",
  status: "expired",
  interval: "monthly",
  amount: 0,
  currency: "NGN",
  current_period_end: null,
  currentPeriodEnd: null,
  cancel_at_period_end: false,
  cancelAtPeriodEnd: false,
  scheduled_change: null,
  scheduledChange: null,
};

export function usePlans(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: async (): Promise<Plan[]> => {
      try {
        const res = await api.get<{ plans?: Plan[] } | Plan[]>(
          "/billing/plans",
        );
        const data = res.data;
        if (Array.isArray(data)) {
          return data;
        }
        if (data && Array.isArray(data.plans)) {
          return data.plans;
        }
        return FALLBACK_PLANS;
      } catch (error) {
        console.warn(
          "Failed to fetch billing plans, falling back to default plans:",
          error,
        );
        return FALLBACK_PLANS;
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBillingStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["billing", "status"],
    queryFn: async (): Promise<SubscriptionStatus> => {
      try {
        const res = await api.get<Record<string, any>>("/billing");
        const data = res.data ?? DEFAULT_BILLING_STATUS;
        const rawChange = data.scheduledChange || data.scheduled_change;
        const normalizedChange: ScheduledChangeInfo | null = rawChange
          ? {
              targetTier: rawChange.targetTier || rawChange.target_tier,
              target_tier: rawChange.targetTier || rawChange.target_tier,
              effectiveAt: rawChange.effectiveAt || rawChange.effective_at,
              effective_at: rawChange.effectiveAt || rawChange.effective_at,
              status: rawChange.status,
            }
          : null;

        const periodEnd =
          data.currentPeriodEnd || data.current_period_end || null;
        const cancelAtEnd =
          data.cancelAtPeriodEnd ?? data.cancel_at_period_end ?? false;

        return {
          ...DEFAULT_BILLING_STATUS,
          ...data,
          tier: data.tier || "free",
          status: data.status || "expired",
          interval: data.interval || "monthly",
          amount: typeof data.amount === "number" ? data.amount : 0,
          currency: data.currency || "NGN",
          currentPeriodEnd: periodEnd,
          current_period_end: periodEnd,
          cancelAtPeriodEnd: cancelAtEnd,
          cancel_at_period_end: cancelAtEnd,
          scheduledChange: normalizedChange,
          scheduled_change: normalizedChange,
        };
      } catch {
        return DEFAULT_BILLING_STATUS;
      }
    },
    enabled: options?.enabled ?? true,
  });
}

export type CheckoutSession = {
  checkoutUrl: string;
  reference: string;
};

export function billingReturnUrl(): string {
  return `${window.location.origin}/settings/billing`;
}

export function openCheckoutUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("Invalid checkout URL");
  }
  window.location.assign(url);
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (plan: string) => {
      const res = await api.post<CheckoutSession>("/billing/checkout", {
        plan,
        callbackUrl: billingReturnUrl(),
      });
      return res.data;
    },
  });
}

export function useVerifySubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reference: string) => {
      const res = await api.get<SubscriptionStatus>(
        `/billing/verify?reference=${encodeURIComponent(reference)}`,
      );
      return res.data;
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["billing", "status"] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/billing/subscription/cancel");
      return res.data;
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["billing", "status"] });
    },
  });
}

export function useDowngradeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: string) => {
      const res = await api.post("/billing/subscription/downgrade", { plan });
      return res.data;
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["billing", "status"] });
    },
  });
}

export function useCancelDowngrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/billing/subscription/downgrade/cancel");
      return res.data;
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["billing", "status"] });
    },
  });
}

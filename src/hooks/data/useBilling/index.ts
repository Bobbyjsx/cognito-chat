import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface Plan {
  id: string;
  tier: string;
  interval: string;
  amount: number;
  currency: string;
}

export interface SubscriptionStatus {
  tier: string;
  status: string;
  interval: string;
  amount: number;
  currency: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export function usePlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: async () => {
      const res = await api.get<{ plans: Plan[] }>("/billing/plans");
      return res.data.plans;
    },
  });
}

export function useBillingStatus() {
  return useQuery({
    queryKey: ["billing", "status"],
    queryFn: async () => {
      const res = await api.get<SubscriptionStatus>("/billing");
      return res.data;
    },
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (plan: string) => {
      const res = await api.post<{
        authorization_url: string;
        reference: string;
      }>("/billing/checkout", { plan });
      return res.data;
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
      queryClient.invalidateQueries({ queryKey: ["billing", "status"] });
    },
  });
}

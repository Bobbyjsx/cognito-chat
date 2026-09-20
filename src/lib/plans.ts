export type PlanTier = "free" | "go" | "premium";

export type PlanDefinition = {
  id: PlanTier;
  name: string;
  priceNgn: number;
  interval: string;
  blurb: string;
  usageHeadline: string;
  features: string[];
  cta: string;
};

export const PLAN_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  go: 1,
  premium: 2,
};

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceNgn: 0,
    interval: "month",
    blurb: "Try Cognito with a starter usage allowance.",
    usageHeadline: "Starter usage allowance",
    features: [
      "Access to the Cognito workspace",
      "A starter usage allowance",
      "No card required",
    ],
    cta: "Get started free",
  },
  go: {
    id: "go",
    name: "Go",
    priceNgn: 5_999,
    interval: "month",
    blurb:
      "For individuals who want higher limits and every frontier model in one app.",
    usageHeadline: "2× higher limits than Free",
    features: [
      "Claude, Gemini & GPT — all in one app",
      "2× higher limits than Free",
      "Higher context windows and memory (coming soon with RAG)",
      "Access to pinned chats",
      "Instant mid-conversation model switching",
      "Rolling limits that reset on their own",
    ],
    cta: "Get started with Go",
  },
  premium: {
    id: "premium",
    name: "Premium",
    priceNgn: 9_999,
    interval: "month",
    blurb:
      "For power users who need maximum limits and exclusive professional tools.",
    usageHeadline: "Highest limits & exclusive pro tools",
    features: [
      "Everything in Go, plus:",
      "Access to Prompt Library",
      "Access to Custom Instructions",
      "Priority access when demand is high",
    ],
    cta: "Get started with Premium",
  },
};

export const PAID_PLANS: PlanDefinition[] = [PLANS.go, PLANS.premium];

export function normalizeTier(tier: string | null | undefined): PlanTier {
  const key = (tier ?? "free").toLowerCase();
  if (key === "go" || key === "premium" || key === "free") return key;
  return "free";
}

export function isPaidTier(tier: string | null | undefined): boolean {
  const normalized = normalizeTier(tier);
  return PLAN_HIERARCHY[normalized] >= PLAN_HIERARCHY.go;
}

export function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function billingCallbackUrl(plan: PlanTier): string {
  if (plan === "free") return "/chat";
  return `/settings/billing?plan=${plan}`;
}

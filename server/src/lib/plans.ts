import { PLANS } from "@/adapters/stripe/stripe-billing-adapter";

export type PlanId = "free" | "starter" | "pro";

const ORDER: Record<PlanId, number> = { free: 0, starter: 1, pro: 2 };

export function normalizePlan(plan?: string | null): PlanId {
  if (plan === "starter" || plan === "pro") return plan;
  return "free";
}

/** Minimum plan required per feature. Single source of truth for gates. */
export const FEATURE_MIN_PLAN: Record<string, PlanId> = {
  "api-keys": "starter",
  audit: "pro",
  uploads: "starter",
  members: "free",
  billing: "free",
};

export function planAllows(plan: string | undefined | null, feature: string): boolean {
  const have = ORDER[normalizePlan(plan)];
  const need = ORDER[FEATURE_MIN_PLAN[feature] ?? "free"];
  return have >= need;
}

export function planSeats(plan: string | undefined | null): number {
  const found = PLANS.find((p) => p.id === normalizePlan(plan));
  return found?.seats ?? 1;
}

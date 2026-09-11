export const PLANS = [
  { id: "free", name: "Free", monthly: 0, seats: 1 },
  { id: "starter", name: "Starter", monthly: 19, seats: 5 },
  { id: "pro", name: "Pro", monthly: 49, seats: 25 },
] as const;

export const PAGE_KEYS = ["dashboard", "members", "billing", "api-keys", "audit", "admin"] as const;

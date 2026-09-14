export type IOrganization = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  stripeCustomerId: string | null;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MembershipRole = "owner" | "admin" | "member";

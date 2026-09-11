import { IOrganization, MembershipRole } from "../entities/organization";

export type IOrganizationRepository = {
  create: (data: { name: string; slug: string }) => Promise<IOrganization>;
  findById: (id: string) => Promise<IOrganization | null>;
  findBySlug: (slug: string) => Promise<IOrganization | null>;
  findByStripeCustomerId: (stripeCustomerId: string) => Promise<IOrganization | null>;
  listForUser: (userId: string) => Promise<(IOrganization & { role: MembershipRole })[]>;
  update: (id: string, data: Partial<IOrganization>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export type IMembershipRepository = {
  add: (data: { userId: string; organizationId: string; role: MembershipRole }) => Promise<void>;
  findRole: (userId: string, organizationId: string) => Promise<MembershipRole | null>;
  listMembers: (organizationId: string) => Promise<{ userId: string; email: string; name: string | null; role: MembershipRole }[]>;
  updateRole: (userId: string, organizationId: string, role: MembershipRole) => Promise<void>;
  remove: (userId: string, organizationId: string) => Promise<void>;
};

export type IInvitationRepository = {
  create: (data: { organizationId: string; email: string; role: MembershipRole; tokenHash: string; expiresAt: Date; invitedById: string }) => Promise<void>;
  findById: (id: string) => Promise<{ id: string; organizationId: string; email: string; acceptedAt: Date | null } | null>;
  findByTokenHash: (tokenHash: string) => Promise<{ id: string; organizationId: string; email: string; role: MembershipRole; expiresAt: Date; acceptedAt: Date | null } | null>;
  updateToken: (id: string, data: { tokenHash: string; expiresAt: Date }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  markAccepted: (id: string) => Promise<void>;
};

export type ISubscriptionRepository = {
  findByOrganization: (organizationId: string) => Promise<{ plan: string; status: string; seats: number; currentPeriodEnd: Date | null } | null>;
  findOrganizationId: (stripeSubscriptionId: string) => Promise<string | null>;
  upsertByStripeId: (data: { stripeSubscriptionId: string; organizationId: string; status: string; plan: string; seats: number; currentPeriodEnd: Date | null }) => Promise<void>;
  updateStatus: (stripeSubscriptionId: string, status: string) => Promise<void>;
};

export type IApiKeyRepository = {
  create: (data: { userId: string; organizationId?: string; name: string; keyPrefix: string; keyHash: string; scopes: string[]; expiresAt?: Date }) => Promise<{ id: string }>;
  findByHash: (keyHash: string) => Promise<{ id: string; userId: string; organizationId: string | null; scopes: string[]; revokedAt: Date | null; expiresAt: Date | null } | null>;
  list: (userId: string) => Promise<{ id: string; name: string; keyPrefix: string; scopes: string[]; createdAt: Date }[]>;
  revoke: (id: string, userId: string) => Promise<void>;
  touch: (id: string) => Promise<void>;
};

export type IAuditRepository = {
  append: (data: { userId?: string; organizationId?: string; action: string; entity?: string; entityId?: string; metadata?: unknown }) => Promise<void>;
  list: (organizationId: string, take?: number) => Promise<unknown[]>;
};

export type INotificationRepository = {
  list: (userId: string) => Promise<unknown[]>;
  markRead: (id: string, userId: string) => Promise<void>;
  create: (data: { userId: string; title: string; body?: string }) => Promise<void>;
};

export type IPasswordHasher = {
  hash: (plain: string) => Promise<string>;
  compare: (plain: string, hashed: string) => Promise<boolean>;
};

export type IRefreshTokenRepository = {
  create: (data: { userId: string; jti: string; family: string; expiresAt: Date }) => Promise<void>;
  findByJti: (jti: string) => Promise<{ userId: string; family: string; revokedAt: Date | null; expiresAt: Date } | null>;
  rotate: (oldJti: string, next: { jti: string; expiresAt: Date }) => Promise<void>;
  revokeFamily: (family: string) => Promise<void>;
  revokeJti: (jti: string) => Promise<void>;
  revokeAllForUser: (userId: string) => Promise<void>;
};

export type IPasswordResetRepository = {
  create: (data: { userId: string; tokenHash: string; expiresAt: Date }) => Promise<void>;
  findValid: (tokenHash: string) => Promise<{ id: string; userId: string; expiresAt: Date; usedAt: Date | null } | null>;
  markUsed: (id: string) => Promise<void>;
};

export type IOAuthAccountRepository = {
  findByProvider: (provider: string, providerId: string) => Promise<{ id: string; userId: string } | null>;
  create: (data: { userId: string; provider: string; providerId: string; email?: string }) => Promise<void>;
  listByUser: (userId: string) => Promise<{ provider: string; email: string | null }[]>;
};

export type IWebhookEventRepository = {
  /** Atomically claims an event id. Returns false when already processed (Stripe retry). */
  claim: (eventId: string, type: string) => Promise<boolean>;
};

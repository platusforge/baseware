import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";
import { logger } from "@/logger";
import { IApiKeyRepository, IAuditRepository, IInvitationRepository, IMembershipRepository, INotificationRepository, IOAuthAccountRepository, IOrganizationRepository, IPasswordResetRepository, IRefreshTokenRepository, ISubscriptionRepository, IWebhookEventRepository } from "@/types/repositories/saas-repositories";
import { MembershipRole } from "@/types/entities/organization";

export class PrismaOrganizationRepository implements IOrganizationRepository {
  async create(data: { name: string; slug: string }) {
    return prisma.organization.create({ data }) as never;
  }
  async findById(id: string) {
    try {
      return await prisma.organization.findUnique({ where: { id } }) as never;
    } catch (err) {
      logger.error(`PrismaOrganizationRepository.findById error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
  async findBySlug(slug: string) {
    try {
      return await prisma.organization.findUnique({ where: { slug } }) as never;
    } catch (err) {
      logger.error(`PrismaOrganizationRepository.findBySlug error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
  async findByStripeCustomerId(stripeCustomerId: string) {
    try {
      return await prisma.organization.findFirst({ where: { stripeCustomerId } }) as never;
    } catch (err) {
      logger.error(`PrismaOrganizationRepository.findByStripeCustomerId error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
  async listForUser(userId: string) {
    try {
      const rows = await prisma.membership.findMany({
        where: { userId },
        include: { organization: true },
        orderBy: { createdAt: "asc" },
      });
      return rows.map((m) => ({ ...(m.organization as object), role: m.role as MembershipRole })) as never;
    } catch (err) {
      logger.error(`PrismaOrganizationRepository.listForUser error: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }
  async update(id: string, data: Partial<{ name: string; plan: string; stripeCustomerId: string }>) {
    await prisma.organization.update({ where: { id }, data: data as never });
  }
}

export class PrismaMembershipRepository implements IMembershipRepository {
  async add(data: { userId: string; organizationId: string; role: MembershipRole }) {
    await prisma.membership.create({ data: data as never });
  }
  async findRole(userId: string, organizationId: string) {
    try {
      const m = await prisma.membership.findUnique({ where: { userId_organizationId: { userId, organizationId } } });
      return (m?.role as MembershipRole) ?? null;
    } catch (err) {
      logger.error(`PrismaMembershipRepository.findRole error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
  async listMembers(organizationId: string) {
    try {
      const rows = await prisma.membership.findMany({ where: { organizationId }, include: { user: true } });
      return rows.map((m) => ({ userId: m.userId, email: m.user.email, name: m.user.name, role: m.role as MembershipRole }));
    } catch (err) {
      logger.error(`PrismaMembershipRepository.listMembers error: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }
  async updateRole(userId: string, organizationId: string, role: MembershipRole) {
    await prisma.membership.update({ where: { userId_organizationId: { userId, organizationId } }, data: { role: role as never } });
  }
  async remove(userId: string, organizationId: string) {
    await prisma.membership.delete({ where: { userId_organizationId: { userId, organizationId } } });
  }
}

export class PrismaInvitationRepository implements IInvitationRepository {
  async create(data: { organizationId: string; email: string; role: MembershipRole; tokenHash: string; expiresAt: Date; invitedById: string }) {
    await prisma.invitation.create({ data: data as never });
  }
  async findByTokenHash(tokenHash: string) {
    try {
      return await prisma.invitation.findUnique({ where: { tokenHash } }) as never;
    } catch (err) {
      logger.error(`PrismaInvitationRepository.findByTokenHash error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
  async markAccepted(id: string) {
    await prisma.invitation.update({ where: { id }, data: { acceptedAt: new Date() } });
  }
}

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  async findByOrganization(organizationId: string) {
    try {
      return await prisma.subscription.findFirst({ where: { organizationId }, orderBy: { createdAt: "desc" } }) as never;
    } catch (err) {
      logger.error(`PrismaSubscriptionRepository error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
  async findOrganizationId(stripeSubscriptionId: string) {
    try {
      const sub = await prisma.subscription.findUnique({ where: { stripeSubscriptionId }, select: { organizationId: true } });
      return sub?.organizationId ?? null;
    } catch (err) {
      logger.error(`PrismaSubscriptionRepository.findOrganizationId error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
  async upsertByStripeId(data: { stripeSubscriptionId: string; organizationId: string; status: string; plan: string; seats: number; currentPeriodEnd: Date | null }) {    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: data.stripeSubscriptionId },
      create: data as never,
      update: { status: data.status as never, plan: data.plan, seats: data.seats, currentPeriodEnd: data.currentPeriodEnd },
    });
  }
  async updateStatus(stripeSubscriptionId: string, status: string) {
    await prisma.subscription.update({ where: { stripeSubscriptionId }, data: { status: status as never } });
  }
}

export class PrismaApiKeyRepository implements IApiKeyRepository {
  async create(data: { userId: string; organizationId?: string; name: string; keyPrefix: string; keyHash: string; scopes: string[] }) {
    return prisma.apiKey.create({ data: data as never, select: { id: true } }) as never;
  }
  async findByHash(keyHash: string) {
    try {
      return await prisma.apiKey.findUnique({ where: { keyHash } }) as never;
    } catch (err) {
      logger.error(`PrismaApiKeyRepository.findByHash error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
  async list(userId: string) {
    try {
      return await prisma.apiKey.findMany({ where: { userId, revokedAt: null }, select: { id: true, name: true, keyPrefix: true, scopes: true, createdAt: true } }) as never;
    } catch (err) {
      logger.error(`PrismaApiKeyRepository.list error: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }
  async revoke(id: string, userId: string) {
    await prisma.apiKey.updateMany({ where: { id, userId }, data: { revokedAt: new Date() } });
  }
  async touch(id: string) {
    await prisma.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
  }
}

export class PrismaAuditRepository implements IAuditRepository {
  async append(data: { userId?: string; organizationId?: string; action: string; entity?: string; entityId?: string; metadata?: unknown }) {
    await prisma.auditLog.create({ data: data as never }).catch((err: unknown) => logger.error(`audit append error: ${err instanceof Error ? err.message : err}`));
  }
  async list(organizationId: string, take = 50) {
    try {
      return await prisma.auditLog.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take });
    } catch (err) {
      logger.error(`PrismaAuditRepository.list error: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }
}

export class PrismaNotificationRepository implements INotificationRepository {
  async list(userId: string) {
    try {
      return await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
    } catch (err) {
      logger.error(`PrismaNotificationRepository.list error: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }
  async markRead(id: string, userId: string) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { readAt: new Date() } });
  }
  async create(data: { userId: string; title: string; body?: string }) {
    await prisma.notification.create({ data });
  }
}

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  async create(data: { userId: string; jti: string; family: string; expiresAt: Date }) {
    await prisma.refreshToken.create({ data });
  }
  async findByJti(jti: string) {
    try {
      return await prisma.refreshToken.findUnique({ where: { jti } }) as never;
    } catch (err) {
      logger.error(`PrismaRefreshTokenRepository.findByJti error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
  async rotate(oldJti: string, next: { jti: string; expiresAt: Date }) {
    const current = await prisma.refreshToken.findUnique({ where: { jti: oldJti } });
    if (!current) throw new Error("Invalid refresh token.");
    await prisma.refreshToken.update({ where: { jti: oldJti }, data: { revokedAt: new Date(), replacedBy: next.jti } });
    await prisma.refreshToken.create({ data: { userId: current.userId, jti: next.jti, family: current.family, expiresAt: next.expiresAt } });
  }
  async revokeFamily(family: string) {
    await prisma.refreshToken.updateMany({ where: { family, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  async revokeJti(jti: string) {
    await prisma.refreshToken.updateMany({ where: { jti }, data: { revokedAt: new Date() } });
  }
}

export class PrismaPasswordResetRepository implements IPasswordResetRepository {  async create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    await prisma.passwordResetToken.create({ data });
  }
  async findValid(tokenHash: string) {
    try {
      return await prisma.passwordResetToken.findUnique({ where: { tokenHash } }) as never;
    } catch (err) {
      logger.error(`PrismaPasswordResetRepository error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
  async markUsed(id: string) {
    await prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  }
}

export class PrismaOAuthAccountRepository implements IOAuthAccountRepository {
  async findByProvider(provider: string, providerId: string) {
    try {
      return await prisma.oAuthAccount.findUnique({ where: { provider_providerId: { provider, providerId } } }) as never;
    } catch (err) {
      logger.error(`PrismaOAuthAccountRepository.findByProvider error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }
  async create(data: { userId: string; provider: string; providerId: string; email?: string }) {
    await prisma.oAuthAccount.create({ data });
  }
  async listByUser(userId: string) {
    try {
      return await prisma.oAuthAccount.findMany({ where: { userId }, select: { provider: true, email: true } }) as never;
    } catch (err) {
      logger.error(`PrismaOAuthAccountRepository.listByUser error: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }
}

export class PrismaWebhookEventRepository implements IWebhookEventRepository {
  async claim(eventId: string, type: string): Promise<boolean> {
    try {
      await prisma.webhookEvent.create({ data: { eventId, type } });
      return true;
    } catch (err) {
      // Unique violation = Stripe retry of an already-processed event.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return false;
      logger.error(`PrismaWebhookEventRepository.claim error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

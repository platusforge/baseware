import { z } from "zod";
import { logger } from "@/logger";
import { IOrganizationRepository, IMembershipRepository, IInvitationRepository, IAuditRepository } from "@/types/repositories/saas-repositories";
import { IUserRepository } from "@/types/repositories/user-repository";
import { IMailAdapter } from "@/adapters/adapters";
import { PLANS } from "@/adapters/stripe/stripe-billing-adapter";
import { randomToken, sha256, slugify } from "@/lib/crypto";
import { env } from "@/env";

const createOrgSchema = z.object({ name: z.string().trim().min(2).max(80) });

export class CreateOrganizationService {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly auditRepository: IAuditRepository,
    private readonly subscriptionRepository?: { upsertByStripeId: (data: { stripeSubscriptionId: string; organizationId: string; status: string; plan: string; seats: number; currentPeriodEnd: Date | null }) => Promise<void> },
  ) {}

  async execute(userId: string, input: unknown) {
    try {
      logger.info("CreateOrganizationService: starting...");
      const data = createOrgSchema.parse(input);
      const slug = `${slugify(data.name)}-${Date.now().toString(36)}`;
      const trialEndsAt = new Date(Date.now() + env.TRIAL_DAYS * 24 * 3600 * 1000);
      const org = await this.organizationRepository.create({ name: data.name, slug });
      await this.organizationRepository.update(org.id, { trialEndsAt } as never);
      await this.membershipRepository.add({ userId, organizationId: org.id, role: "owner" });
      if (this.subscriptionRepository) {
        await this.subscriptionRepository
          .upsertByStripeId({
            stripeSubscriptionId: `trial_${org.id}`,
            organizationId: org.id,
            status: "trialing",
            plan: "starter",
            seats: 5,
            currentPeriodEnd: trialEndsAt,
          })
          .catch(() => undefined);
      }
      await this.auditRepository.append({ userId, organizationId: org.id, action: "org.created", entity: "organization", entityId: org.id });
      logger.info("CreateOrganizationService: completed");
      return { ...org, trialEndsAt };
    } catch (err) {
      logger.error(`CreateOrganizationService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["admin", "member"]).default("member"),
});

export class InviteMemberService {
  constructor(
    private readonly invitationRepository: IInvitationRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly mailAdapter: IMailAdapter,
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(invitedById: string, organizationId: string, input: unknown) {
    try {
      logger.info("InviteMemberService: starting...");
      const data = inviteSchema.parse(input);
      const existing = await this.membershipRepository.findRole(invitedById, organizationId);
      if (!existing || !["owner", "admin"].includes(existing)) throw new Error("Forbidden");
      const org = await this.organizationRepository.findById(organizationId);
      if (!org) throw new Error("Organization not found.");
      const plan = PLANS.find((p) => p.id === (org as { plan: string }).plan) ?? PLANS[0];
      const members = await this.membershipRepository.listMembers(organizationId);
      if (members.length >= plan.seats) {
        throw new Error("Seat limit reached for this plan. Upgrade to invite more members.");
      }
      const token = randomToken();
      await this.invitationRepository.create({
        organizationId,
        email: data.email,
        role: data.role,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        invitedById,
      });
      await this.mailAdapter.sendMail({
        to: data.email,
        subject: "You are invited",
        html: `<p>Accept your invitation: <a href="${env.FRONTEND_URL}/invite?token=${token}">link</a>.</p>`,
      });
      logger.info("InviteMemberService: completed");
      return { message: "Invitation sent." };
    } catch (err) {
      logger.error(`InviteMemberService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class AcceptInvitationService {
  constructor(
    private readonly invitationRepository: IInvitationRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: { token: string; userId: string }) {
    try {
      logger.info("AcceptInvitationService: starting...");
      const parsed = z.object({ token: z.string().min(10).max(512), userId: z.string().min(1).max(128) }).parse(input);
      const record = await this.invitationRepository.findByTokenHash(sha256(parsed.token));
      if (!record || record.acceptedAt || record.expiresAt < new Date()) throw new Error("Invalid or expired invitation.");
      // The invitation is bound to one email: only that account may claim it.
      const user = (await this.userRepository.findById(parsed.userId)) as { email: string } | null;
      if (!user || user.email.toLowerCase() !== record.email.toLowerCase()) {
        throw new Error("This invitation was sent to a different email address.");
      }
      const existing = await this.membershipRepository.findRole(parsed.userId, record.organizationId);
      if (!existing) await this.membershipRepository.add({ userId: parsed.userId, organizationId: record.organizationId, role: record.role });
      await this.invitationRepository.markAccepted(record.id);
      logger.info("AcceptInvitationService: completed");
      return { organizationId: record.organizationId };
    } catch (err) {
      logger.error(`AcceptInvitationService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

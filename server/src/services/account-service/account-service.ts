import { z } from "zod";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import {
  IAuditRepository,
  IInvitationRepository,
  IMembershipRepository,
  IOrganizationRepository,
  IPasswordHasher,
  IRefreshTokenRepository,
} from "@/types/repositories/saas-repositories";
import { IMailAdapter } from "@/adapters/adapters";
import { randomToken, sha256 } from "@/lib/crypto";
import { env } from "@/env";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128),
});

export class ChangePasswordService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(userId: string, input: unknown) {
    try {
      logger.info("ChangePasswordService: starting...");
      const data = changePasswordSchema.parse(input);
      const user = await this.userRepository.findByIdWithHash(userId);
      if (!user || !user.passwordHash) throw new Error("Invalid credentials.");
      const ok = await this.passwordHasher.compare(data.currentPassword, user.passwordHash);
      if (!ok) throw new Error("Invalid credentials.");
      await this.userRepository.update(userId, {
        passwordHash: await this.passwordHasher.hash(data.newPassword),
        passwordChangedAt: new Date(),
      } as never);
      await this.refreshTokenRepository.revokeAllForUser(userId);
      logger.info("ChangePasswordService: completed");
      return { message: "Password updated. All other sessions were signed out." };
    } catch (err) {
      logger.error(`ChangePasswordService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128).optional(),
});

export class DeleteAccountService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(userId: string, input: unknown) {
    try {
      logger.info("DeleteAccountService: starting...");
      const data = deleteAccountSchema.parse(input);
      const user = await this.userRepository.findByIdWithHash(userId);
      if (!user) throw new Error("Missing credentials.");
      if (user.passwordHash) {
        if (!data.password) throw new Error("Password confirmation required.");
        const ok = await this.passwordHasher.compare(data.password, user.passwordHash);
        if (!ok) throw new Error("Invalid credentials.");
      }
      // Memberships, keys, tokens and notifications cascade; audit rows keep SetNull author.
      await this.userRepository.remove(userId);
      logger.info("DeleteAccountService: completed");
      return { message: "Account deleted." };
    } catch (err) {
      logger.error(`DeleteAccountService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class DeleteOrganizationService {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly auditRepository: IAuditRepository,
  ) {}

  async execute(userId: string, organizationId: string) {
    try {
      logger.info("DeleteOrganizationService: starting...");
      const role = await this.membershipRepository.findRole(userId, organizationId);
      if (role !== "owner") throw new Error("Forbidden");
      const org = await this.organizationRepository.findById(organizationId);
      if (!org) throw new Error("Organization not found.");
      await this.auditRepository.append({ userId, action: "org.deleted", entity: "organization", entityId: organizationId });
      // Memberships, invitations, subscriptions and api keys cascade.
      await this.organizationRepository.remove(organizationId);
      logger.info("DeleteOrganizationService: completed");
      return { message: "Organization deleted." };
    } catch (err) {
      logger.error(`DeleteOrganizationService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class ResendInvitationService {
  constructor(
    private readonly invitationRepository: IInvitationRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly mailAdapter: IMailAdapter,
  ) {}

  async execute(userId: string, organizationId: string, invitationId: string) {
    try {
      logger.info("ResendInvitationService: starting...");
      const role = await this.membershipRepository.findRole(userId, organizationId);
      if (!role || !["owner", "admin"].includes(role)) throw new Error("Forbidden");
      const invitation = await this.invitationRepository.findById(invitationId);
      if (!invitation || invitation.organizationId !== organizationId || invitation.acceptedAt) {
        throw new Error("Invitation not found.");
      }
      const token = randomToken();
      await this.invitationRepository.updateToken(invitationId, {
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      });
      await this.mailAdapter.sendMail({
        to: invitation.email,
        subject: "You are invited",
        html: `<p>Accept your invitation: <a href="${env.FRONTEND_URL}/invite?token=${token}">link</a>.</p>`,
      });
      logger.info("ResendInvitationService: completed");
      return { message: "Invitation resent." };
    } catch (err) {
      logger.error(`ResendInvitationService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class RevokeInvitationService {
  constructor(
    private readonly invitationRepository: IInvitationRepository,
    private readonly membershipRepository: IMembershipRepository,
  ) {}

  async execute(userId: string, organizationId: string, invitationId: string) {
    try {
      logger.info("RevokeInvitationService: starting...");
      const role = await this.membershipRepository.findRole(userId, organizationId);
      if (!role || !["owner", "admin"].includes(role)) throw new Error("Forbidden");
      const invitation = await this.invitationRepository.findById(invitationId);
      if (!invitation || invitation.organizationId !== organizationId) throw new Error("Invitation not found.");
      await this.invitationRepository.remove(invitationId);
      logger.info("RevokeInvitationService: completed");
      return { message: "Invitation revoked." };
    } catch (err) {
      logger.error(`RevokeInvitationService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

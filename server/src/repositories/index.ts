import { IUserRepository } from "@/types/repositories/user-repository";
import { IApiKeyRepository, IAuditRepository, IInvitationRepository, IMembershipRepository, INotificationRepository, IOAuthAccountRepository, IOrganizationRepository, IPasswordHasher, IPasswordResetRepository, IRefreshTokenRepository, ISubscriptionRepository, IWebhookEventRepository } from "@/types/repositories/saas-repositories";
import { PrismaUserRepository } from "./prisma/prisma-user-repository";
import { PrismaApiKeyRepository, PrismaAuditRepository, PrismaInvitationRepository, PrismaMembershipRepository, PrismaNotificationRepository, PrismaOAuthAccountRepository, PrismaOrganizationRepository, PrismaPasswordResetRepository, PrismaRefreshTokenRepository, PrismaSubscriptionRepository, PrismaWebhookEventRepository } from "./prisma/prisma-saas-repositories";
import { BcryptPasswordHasher } from "./bcrypt/bcrypt-password-hasher";

export const userRepository: IUserRepository = new PrismaUserRepository();
export const organizationRepository: IOrganizationRepository = new PrismaOrganizationRepository();
export const membershipRepository: IMembershipRepository = new PrismaMembershipRepository();
export const invitationRepository: IInvitationRepository = new PrismaInvitationRepository();
export const subscriptionRepository: ISubscriptionRepository = new PrismaSubscriptionRepository();
export const apiKeyRepository: IApiKeyRepository = new PrismaApiKeyRepository();
export const auditRepository: IAuditRepository = new PrismaAuditRepository();
export const notificationRepository: INotificationRepository = new PrismaNotificationRepository();
export const refreshTokenRepository: IRefreshTokenRepository = new PrismaRefreshTokenRepository();
export const passwordResetRepository: IPasswordResetRepository = new PrismaPasswordResetRepository();
export const oauthAccountRepository: IOAuthAccountRepository = new PrismaOAuthAccountRepository();
export const webhookEventRepository: IWebhookEventRepository = new PrismaWebhookEventRepository();
export const passwordHasher: IPasswordHasher = new BcryptPasswordHasher();

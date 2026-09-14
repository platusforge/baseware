import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import { IAuditRepository, INotificationRepository, ISubscriptionRepository, IOrganizationRepository } from "@/types/repositories/saas-repositories";

export class GetAdminStatsService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly auditRepository: IAuditRepository,
  ) {}

  async execute() {
    try {
      logger.info("GetAdminStatsService: starting...");
      const totalUsers = await this.userRepository.count();
      logger.info("GetAdminStatsService: completed");
      return { totalUsers, generatedAt: new Date().toISOString() };
    } catch (err) {
      logger.error(`GetAdminStatsService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class ListNotificationsService {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(userId: string) {
    try {
      logger.info("ListNotificationsService: starting...");
      const items = await this.notificationRepository.list(userId);
      logger.info("ListNotificationsService: completed");
      return items;
    } catch (err) {
      logger.error(`ListNotificationsService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class GetSubscriptionStatusService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(organizationId: string) {
    try {
      logger.info("GetSubscriptionStatusService: starting...");
      const org = (await this.organizationRepository.findById(organizationId)) as {
        plan?: string;
        trialEndsAt?: Date | null;
      } | null;
      const subscription = await this.subscriptionRepository.findByOrganization(organizationId);
      logger.info("GetSubscriptionStatusService: completed");
      return {
        plan: subscription?.plan ?? org?.plan ?? "free",
        status: subscription?.status ?? "none",
        subscription,
        trialEndsAt: org?.trialEndsAt ?? null,
      };
    } catch (err) {
      logger.error(`GetSubscriptionStatusService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

import { z } from "zod";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import { IApiKeyRepository, IAuditRepository, IMembershipRepository, INotificationRepository, IOrganizationRepository } from "@/types/repositories/saas-repositories";

const schema = z.string().min(1, { message: "Missing credentials." }).max(128);

export class ExportUserDataService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly auditRepository: IAuditRepository,
  ) {}

  async execute(userId: string) {
    try {
      logger.info("ExportUserDataService: starting...");
      if (!userId) throw new Error("Missing credentials.");
      const id = schema.parse(userId);
      const user = await this.userRepository.findById(id);
      if (!user) throw new Error("Missing credentials.");
      const orgs = await this.organizationRepository.listForUser(id);
      const keys = await this.apiKeyRepository.list(id);
      const notifications = await this.notificationRepository.list(id);
      const auditByOrg: Record<string, unknown[]> = {};
      for (const org of orgs as { id: string }[]) {
        auditByOrg[org.id] = await this.auditRepository.list(org.id, 200);
      }
      logger.info("ExportUserDataService: completed");
      return {
        exportedAt: new Date().toISOString(),
        user,
        organizations: orgs,
        apiKeys: (keys as { keyHash?: string }[]).map(({ keyHash, ...rest }) => rest),
        notifications,
        auditByOrg,
      };
    } catch (err) {
      logger.error(`ExportUserDataService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

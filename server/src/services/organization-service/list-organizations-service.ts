import { logger } from "@/logger";
import { IOrganizationRepository } from "@/types/repositories/saas-repositories";

export class ListOrganizationsService {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(userId: string) {
    try {
      logger.info("ListOrganizationsService: starting...");
      if (!userId) throw new Error("Missing credentials.");
      const result = await this.organizationRepository.listForUser(userId);
      logger.info("ListOrganizationsService: completed");
      return result;
    } catch (err) {
      logger.error(`ListOrganizationsService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

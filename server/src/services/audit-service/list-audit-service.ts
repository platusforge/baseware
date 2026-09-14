import { z } from "zod";
import { logger } from "@/logger";
import { IAuditRepository } from "@/types/repositories/saas-repositories";

const schema = z.object({ organizationId: z.string().uuid() });

export class ListAuditService {
  constructor(private readonly auditRepository: IAuditRepository) {}

  async execute(input: unknown) {
    try {
      logger.info("ListAuditService: starting...");
      const data = schema.parse(input);
      const result = await this.auditRepository.list(data.organizationId);
      logger.info("ListAuditService: completed");
      return result;
    } catch (err) {
      logger.error(`ListAuditService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

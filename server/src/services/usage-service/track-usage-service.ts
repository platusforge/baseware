import { z } from "zod";
import { logger } from "@/logger";
import { IMembershipRepository, IUsageEventRepository } from "@/types/repositories/saas-repositories";

const schema = z.object({
  organizationId: z.string().uuid(),
  metric: z.string().trim().min(1).max(64).regex(/^[a-z0-9_.-]+$/i, "Invalid metric."),
  quantity: z.coerce.number().int().min(1).max(100000),
});

export class TrackUsageService {
  constructor(
    private readonly usageRepository: IUsageEventRepository,
    private readonly membershipRepository: IMembershipRepository,
  ) {}

  async execute(userId: string, input: unknown) {
    try {
      logger.info("TrackUsageService: starting...");
      const data = schema.parse(input);
      const role = await this.membershipRepository.findRole(userId, data.organizationId);
      if (!role) throw new Error("Forbidden");
      await this.usageRepository.track(data);
      logger.info("TrackUsageService: completed");
      return { tracked: true };
    } catch (err) {
      logger.error(`TrackUsageService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

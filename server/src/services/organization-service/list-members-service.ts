import { z } from "zod";
import { logger } from "@/logger";
import { IMembershipRepository } from "@/types/repositories/saas-repositories";

const schema = z.object({ organizationId: z.string().uuid() });

export class ListMembersService {
  constructor(private readonly membershipRepository: IMembershipRepository) {}

  async execute(input: unknown) {
    try {
      logger.info("ListMembersService: starting...");
      const data = schema.parse(input);
      const result = await this.membershipRepository.listMembers(data.organizationId);
      logger.info("ListMembersService: completed");
      return result;
    } catch (err) {
      logger.error(`ListMembersService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

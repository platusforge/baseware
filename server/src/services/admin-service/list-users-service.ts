import { z } from "zod";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";

const schema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).max(10000).default(0),
  search: z.string().trim().max(254).optional(),
});

export class ListUsersService {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: unknown) {
    try {
      logger.info("ListUsersService: starting...");
      const data = schema.parse(input ?? {});
      const [items, total] = await Promise.all([
        this.userRepository.list({ take: data.take, skip: data.skip, search: data.search }),
        this.userRepository.count({ search: data.search }),
      ]);
      logger.info("ListUsersService: completed");
      return { items, total };
    } catch (err) {
      logger.error(`ListUsersService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

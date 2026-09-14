import { z } from "zod";
import { logger } from "@/logger";
import { INotificationRepository } from "@/types/repositories/saas-repositories";

const schema = z.object({ id: z.string().min(1).max(128) });

export class MarkNotificationReadService {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(userId: string, input: unknown) {
    try {
      logger.info("MarkNotificationReadService: starting...");
      if (!userId) throw new Error("Missing credentials.");
      const data = schema.parse(input);
      await this.notificationRepository.markRead(data.id, userId);
      logger.info("MarkNotificationReadService: completed");
      return { read: true };
    } catch (err) {
      logger.error(`MarkNotificationReadService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

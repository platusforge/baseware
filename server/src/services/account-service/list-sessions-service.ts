import { z } from "zod";
import { logger } from "@/logger";
import { IRefreshTokenRepository } from "@/types/repositories/saas-repositories";

const listSchema = z.string().min(1).max(128);
const revokeSchema = z.object({ id: z.string().min(1).max(128) });

export class ListSessionsService {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(userId: string) {
    try {
      logger.info("ListSessionsService: starting...");
      const id = listSchema.parse(userId);
      const items = await this.refreshTokenRepository.listForUser(id);
      logger.info("ListSessionsService: completed");
      return items.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        revokedAt: s.revokedAt,
      }));
    } catch (err) {
      logger.error(`ListSessionsService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class RevokeSessionService {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(userId: string, input: unknown) {
    try {
      logger.info("RevokeSessionService: starting...");
      if (!userId) throw new Error("Missing credentials.");
      const data = revokeSchema.parse(input);
      await this.refreshTokenRepository.revokeOne(data.id, userId);
      logger.info("RevokeSessionService: completed");
      return { revoked: true };
    } catch (err) {
      logger.error(`RevokeSessionService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

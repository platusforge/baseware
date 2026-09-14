import { z } from "zod";
import { logger } from "@/logger";
import { IRefreshTokenRepository } from "@/types/repositories/saas-repositories";
import { verifyToken } from "@/lib/jwt";

const schema = z.string().min(1).max(4096).optional();

export class LogoutService {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(input: unknown) {
    try {
      logger.info("LogoutService: starting...");
      const token = schema.parse(input);
      if (token) {
        try {
          const payload = verifyToken(token);
          await this.refreshTokenRepository.revokeJti(payload.jti);
        } catch {
          // ignore invalid token on logout
        }
      }
      logger.info("LogoutService: completed");
      return { message: "Logged out." };
    } catch (err) {
      logger.error(`LogoutService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

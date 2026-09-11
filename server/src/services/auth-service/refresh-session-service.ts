import { randomUUID } from "crypto";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import { IRefreshTokenRepository } from "@/types/repositories/saas-repositories";
import { signAccessToken, signRefreshToken, verifyToken } from "@/lib/jwt";

export class RefreshSessionService {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(refreshToken: string) {
    try {
      logger.info("RefreshSessionService: starting...");
      if (!refreshToken) throw new Error("Invalid refresh token.");
      const payload = verifyToken(refreshToken);
      const stored = await this.refreshTokenRepository.findByJti(payload.jti);
      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        if (stored && stored.revokedAt) await this.refreshTokenRepository.revokeFamily(stored.family);
        throw new Error("Invalid refresh token.");
      }
      const sessionUser = await this.userRepository.findSessionUser(payload.sub);
      if (!sessionUser || sessionUser.active === false) throw new Error("Invalid refresh token.");
      const nextJti = randomUUID();
      await this.refreshTokenRepository.rotate(payload.jti, { jti: nextJti, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) });
      const accessToken = signAccessToken(payload.sub, randomUUID());
      const nextRefresh = signRefreshToken(payload.sub, nextJti);
      logger.info("RefreshSessionService: completed");
      return { accessToken, refreshToken: nextRefresh };
    } catch (err) {
      logger.error(`RefreshSessionService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

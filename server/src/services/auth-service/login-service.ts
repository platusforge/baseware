import { z } from "zod";
import { randomUUID } from "crypto";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import { IPasswordHasher, IRefreshTokenRepository } from "@/types/repositories/saas-repositories";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { verifyTotp } from "@/lib/totp";
import { sha256 } from "@/lib/crypto";

const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.CxEO8N9ZQ0xG3h6x5y8vJ9w0q1e2r3t4";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
  mfaCode: z.string().regex(/^([0-9a-f]{12}|\d{6})$/).optional(),
});

export class LoginService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: unknown) {
    try {
      logger.info("LoginService: starting...");
      const data = loginSchema.parse(input);
      const user = (await this.userRepository.findByEmail(data.email)) as never as {
        id: string; passwordHash: string | null; active: boolean; lockedUntil: Date | null;
        failedLoginAttempts: number; mfaEnabled: boolean; mfaSecret: string | null;
        mfaBackupCodes: string[]; emailVerifiedAt: Date | null; mustChangePassword: boolean } | null;

      const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
      const ok = await this.passwordHasher.compare(data.password, hashToCompare);

      if (!user || !ok) {
        if (user) {
          const attempts = (user.failedLoginAttempts ?? 0) + 1;
          const lockedUntil = attempts >= 10 ? new Date(Date.now() + 60 * 60 * 1000) : attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          await this.userRepository.update(user.id, { failedLoginAttempts: attempts, lockedUntil });
          if (lockedUntil) logger.warn(`LoginService: account locked userId=${user.id}`);
        }
        throw new Error("Invalid credentials.");
      }

      if (user.active === false) throw new Error("Invalid credentials.");
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        const e = new Error("Too many attempts. Try again later.");
        (e as { status?: number }).status = 429;
        throw e;
      }

      if (user.mfaEnabled) {
        const mfaCode = data.mfaCode as string | undefined;
        if (!mfaCode) {
          const e = new Error("MFA_REQUIRED");
          (e as { status?: number; code?: string }).status = 403;
          (e as { code?: string }).code = "MFA_REQUIRED";
          throw e;
        }
        const isBackup = /^[0-9a-f]{12}$/.test(mfaCode) && (user.mfaBackupCodes ?? []).includes(sha256(mfaCode));
        const totpOk = user.mfaSecret ? verifyTotp(user.mfaSecret, mfaCode) : false;
        if (!isBackup && !totpOk) {
          const attempts = (user.failedLoginAttempts ?? 0) + 1;
          await this.userRepository.update(user.id, { failedLoginAttempts: attempts });
          throw new Error("Invalid credentials.");
        }
        if (isBackup) {
          await this.userRepository.update(user.id, {
            mfaBackupCodes: (user.mfaBackupCodes ?? []).filter((h) => h !== sha256(mfaCode)),
          } as never);
        }
      }

      const jti = randomUUID();
      const family = randomUUID();
      const accessToken = signAccessToken(user.id, jti);
      const refreshJti = randomUUID();
      const refreshToken = signRefreshToken(user.id, refreshJti);
      await this.refreshTokenRepository.create({ userId: user.id, jti: refreshJti, family, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) });
      await this.userRepository.update(user.id, { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() });
      logger.info("LoginService: completed");
      return {
        accessToken,
        refreshToken,
        accessJti: jti,
        mustChangePassword: user.mustChangePassword === true,
        emailVerified: user.emailVerifiedAt !== null,
      };
    } catch (err) {
      logger.error(`LoginService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

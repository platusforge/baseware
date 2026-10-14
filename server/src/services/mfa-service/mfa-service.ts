import { z } from "zod";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import { IRefreshTokenRepository } from "@/types/repositories/saas-repositories";
import { newMfaSecret, otpauthUrl, verifyTotp, newBackupCodes } from "@/lib/totp";
import { sha256 } from "@/lib/crypto";

const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/, "Invalid code.") });
// Disable accepts TOTP (6 digits) or a 12-hex backup code.
const disableCodeSchema = z.object({ code: z.string().regex(/^(\d{6}|[0-9a-f]{12})$/, "Invalid code.") });

export class SetupMfaService {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string) {
    try {
      logger.info("SetupMfaService: starting...");
      if (!userId) throw new Error("Missing credentials.");
      const user = (await this.userRepository.findById(userId)) as { email: string; mfaEnabled: boolean } | null;
      if (!user) throw new Error("Missing credentials.");
      if (user.mfaEnabled) throw new Error("MFA already enabled.");
      const secret = newMfaSecret();
      await this.userRepository.update(userId, { mfaSecret: secret } as never);
      logger.info("SetupMfaService: completed");
      return { secret, otpauthUrl: otpauthUrl(secret, user.email) };
    } catch (err) {
      logger.error(`SetupMfaService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class ConfirmMfaService {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, input: unknown) {
    try {
      logger.info("ConfirmMfaService: starting...");
      const data = codeSchema.parse(input);
      const user = (await this.userRepository.findByIdWithHash(userId)) as {
        mfaSecret: string | null; mfaEnabled: boolean } | null;
      if (!user?.mfaSecret) throw new Error("MFA not initialized. Start setup first.");
      if (!verifyTotp(user.mfaSecret, data.code)) throw new Error("Invalid code.");
      const codes = newBackupCodes();
      await this.userRepository.update(userId, {
        mfaEnabled: true,
        mfaBackupCodes: codes.map((c) => sha256(c)),
      } as never);
      logger.info("ConfirmMfaService: completed");
      return { enabled: true, backupCodes: codes };
    } catch (err) {
      logger.error(`ConfirmMfaService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class DisableMfaService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(userId: string, input: unknown) {
    try {
      logger.info("DisableMfaService: starting...");
      const data = disableCodeSchema.parse(input);
      const user = (await this.userRepository.findByIdWithHash(userId)) as {
        mfaSecret: string | null; mfaEnabled: boolean; mfaBackupCodes: string[] } | null;
      if (!user?.mfaEnabled || !user.mfaSecret) throw new Error("MFA not enabled.");
      const backupMatch = user.mfaBackupCodes?.includes(sha256(data.code));
      const totpOk = verifyTotp(user.mfaSecret, data.code);
      // 6-digit codes are TOTP; backup codes are hex — accept either.
      if (!totpOk && !backupMatch) throw new Error("Invalid code.");
      await this.userRepository.update(userId, { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] } as never);
      await this.refreshTokenRepository.revokeAllForUser(userId);
      logger.info("DisableMfaService: completed");
      return { disabled: true };
    } catch (err) {
      logger.error(`DisableMfaService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

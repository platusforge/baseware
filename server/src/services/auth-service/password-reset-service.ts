import { z } from "zod";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import { IPasswordResetRepository } from "@/types/repositories/saas-repositories";
import { IMailAdapter } from "@/adapters/adapters";
import { randomToken, sha256 } from "@/lib/crypto";
import { env } from "@/env";

const requestSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254) });
const confirmSchema = z.object({ token: z.string().min(10), password: z.string().min(12).max(128) });

export class RequestPasswordResetService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly resetRepository: IPasswordResetRepository,
    private readonly mailAdapter: IMailAdapter,
  ) {}

  async execute(input: unknown) {
    try {
      logger.info("RequestPasswordResetService: starting...");
      const data = requestSchema.parse(input);
      const user = (await this.userRepository.findByEmail(data.email)) as { id: string } | null;
      if (user) {
        const token = randomToken();
        await this.resetRepository.create({ userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 3600 * 1000) });
        await this.mailAdapter.sendMail({
          to: data.email,
          subject: "Reset your password",
          html: `<p>Reset your password: <a href="${env.FRONTEND_URL}/reset-password?token=${token}">link</a> (expires in 1h).</p>`,
        });
      }
      logger.info("RequestPasswordResetService: completed");
      return { message: "If the account exists, a reset link was sent." };
    } catch (err) {
      logger.error(`RequestPasswordResetService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class ConfirmPasswordResetService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly resetRepository: IPasswordResetRepository,
    private readonly passwordHasher: { hash: (p: string) => Promise<string> },
    private readonly refreshTokens: { revokeFamily?: never } | { revokeForUser?: (userId: string) => Promise<void> },
  ) {}

  async execute(input: unknown) {
    try {
      logger.info("ConfirmPasswordResetService: starting...");
      const data = confirmSchema.parse(input);
      const record = (await this.resetRepository.findValid(sha256(data.token))) as { id: string; userId: string; expiresAt: Date; usedAt: Date | null } | null;
      if (!record || record.usedAt || record.expiresAt < new Date()) throw new Error("Invalid or expired token.");
      const hash = await this.passwordHasher.hash(data.password);
      await this.userRepository.update(record.userId, { passwordHash: hash, passwordChangedAt: new Date() } as never);
      await this.resetRepository.markUsed(record.id);
      logger.info("ConfirmPasswordResetService: completed");
      return { message: "Password updated." };
    } catch (err) {
      logger.error(`ConfirmPasswordResetService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

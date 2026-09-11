import { z } from "zod";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import { IMailAdapter } from "@/adapters/adapters";
import { signVerifyToken, verifyVerifyToken } from "@/lib/jwt";
import { env } from "@/env";

export class RequestEmailVerificationService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly mailAdapter: IMailAdapter,
  ) {}

  async execute(userId: string) {
    try {
      logger.info("RequestEmailVerificationService: starting...");
      if (!userId) throw new Error("Missing credentials.");
      const user = (await this.userRepository.findById(userId)) as { id: string; email: string } | null;
      if (!user) throw new Error("Missing credentials.");
      await this.mailAdapter.sendMail({
        to: user.email,
        subject: "Verify your email",
        html: `<p>Confirm your email: <a href="${env.FRONTEND_URL}/verify-email?token=${signVerifyToken(user.id, user.email)}">verify email</a> (expires in 24h).</p>`,
      });
      logger.info("RequestEmailVerificationService: completed");
      return { message: "If the account exists, a verification link was sent." };
    } catch (err) {
      logger.error(`RequestEmailVerificationService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

const confirmSchema = z.object({ token: z.string().min(10).max(2048) });

export class ConfirmEmailVerificationService {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: unknown) {
    try {
      logger.info("ConfirmEmailVerificationService: starting...");
      const data = confirmSchema.parse(input);
      let payload: { sub: string; email: string };
      try {
        payload = verifyVerifyToken(data.token);
      } catch {
        throw new Error("Invalid or expired token.");
      }
      const user = (await this.userRepository.findByEmail(payload.email)) as { id: string } | null;
      if (!user || user.id !== payload.sub) throw new Error("Invalid or expired token.");
      await this.userRepository.update(user.id, { emailVerifiedAt: new Date() });
      logger.info("ConfirmEmailVerificationService: completed");
      return { message: "Email verified." };
    } catch (err) {
      logger.error(`ConfirmEmailVerificationService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

import { z } from "zod";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import { IPasswordHasher } from "@/types/repositories/saas-repositories";
import { IMailAdapter } from "@/adapters/adapters";
import { signVerifyToken } from "@/lib/jwt";
import { env } from "@/env";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

export class RegisterService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly mailAdapter: IMailAdapter,
  ) {}

  async execute(input: unknown) {
    try {
      logger.info("RegisterService: starting...");
      const data = registerSchema.parse(input);
      const existing = await this.userRepository.findByEmail(data.email);
      if (!existing) {
        const passwordHash = await this.passwordHasher.hash(data.password);
        const user = await this.userRepository.create({ email: data.email, name: data.name, passwordHash });
        await this.mailAdapter.sendMail({
          to: data.email,
          subject: "Verify your email",
          html: `<p>Welcome! Confirm your email: <a href="${env.FRONTEND_URL}/verify-email?token=${signVerifyToken(user.id, user.email)}">verify email</a> (expires in 24h).</p>`,
        });
      }
      // Always the same response: no account enumeration via registration.
      logger.info("RegisterService: completed");
      return { message: "If this email is new, a verification link was sent. Check your inbox, then log in." };
    } catch (err) {
      logger.error(`RegisterService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

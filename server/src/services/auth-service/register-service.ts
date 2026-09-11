import { z } from "zod";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import { IPasswordHasher } from "@/types/repositories/saas-repositories";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

export class RegisterService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: unknown) {
    try {
      logger.info("RegisterService: starting...");
      const data = registerSchema.parse(input);
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) throw new Error("Email already in use.");
      const passwordHash = await this.passwordHasher.hash(data.password);
      const user = await this.userRepository.create({ email: data.email, name: data.name, passwordHash });
      logger.info("RegisterService: completed");
      return { id: user.id, email: user.email, name: user.name };
    } catch (err) {
      logger.error(`RegisterService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

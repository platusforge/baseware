import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import { IPermissionRepository } from "@/types/repositories/permission-repository";

export class GetProfileService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(userId: string) {
    try {
      logger.info("GetProfileService: starting...");
      if (!userId) throw new Error("Missing credentials.");
      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error("Not found");
      const permissions = await this.permissionRepository.resolve(userId);
      logger.info("GetProfileService: completed");
      return { ...user, permissions };
    } catch (err) {
      logger.error(`GetProfileService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

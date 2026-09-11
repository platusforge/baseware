import { logger } from "@/logger";
import { IPermissionRepository, ResolvedPermissions } from "@/types/repositories/permission-repository";

export class GetPermissionsService {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(userId: string): Promise<ResolvedPermissions> {
    try {
      logger.info("GetPermissionsService: starting...");
      if (!userId) throw new Error("Missing credentials.");
      const permissions = await this.permissionRepository.resolve(userId);
      logger.info("GetPermissionsService: completed");
      return permissions;
    } catch (err) {
      logger.error(`GetPermissionsService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

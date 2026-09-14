import { z } from "zod";
import { logger } from "@/logger";
import { IPermissionRepository, ResolvedPermissions } from "@/types/repositories/permission-repository";

const schema = z.string().min(1).max(128);

export class GetPermissionsService {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(userId: string): Promise<ResolvedPermissions> {
    try {
      logger.info("GetPermissionsService: starting...");
      if (!userId) throw new Error("Missing credentials.");
      const id = schema.parse(userId);
      const permissions = await this.permissionRepository.resolve(id);
      logger.info("GetPermissionsService: completed");
      return permissions;
    } catch (err) {
      logger.error(`GetPermissionsService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

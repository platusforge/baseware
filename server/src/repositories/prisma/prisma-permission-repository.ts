import { prisma } from "@/prisma";
import { logger } from "@/logger";
import { IPermissionRepository, ResolvedPermissions } from "@/types/repositories/permission-repository";

function toSet(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

/** Mirrors require-page resolution: admin bypass > direct row > default-allow. */
export class PrismaPermissionRepository implements IPermissionRepository {
  async resolve(userId: string): Promise<ResolvedPermissions> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { type: true } });
      if (user?.type === "admin") {
        return { isAdmin: true, allowedPages: [], configured: true };
      }
      const perm = await prisma.userPermission.findUnique({ where: { userId } });
      if (!perm) return { isAdmin: false, allowedPages: [], configured: true };
      return { isAdmin: false, allowedPages: toSet(perm.allowedPages), configured: perm.configured };
    } catch (err) {
      logger.error(`PrismaPermissionRepository.resolve error: ${err instanceof Error ? err.message : err}`);
      return { isAdmin: false, allowedPages: [], configured: false };
    }
  }
}

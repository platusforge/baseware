import { z } from "zod";
import { logger } from "@/logger";
import { IStorageAdapter } from "@/adapters/adapters";
import { IMembershipRepository } from "@/types/repositories/saas-repositories";
import { env } from "@/env";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/csv",
]);

const schema = z.object({
  organizationId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(128),
  contentType: z.string().min(3).max(128),
  contentLength: z.coerce.number().int().positive().max(100 * 1024 * 1024).optional(),
});

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 128);
}

export class GetUploadUrlService {
  constructor(
    private readonly storageAdapter: IStorageAdapter,
    private readonly membershipRepository: IMembershipRepository,
  ) {}

  async execute(userId: string, input: unknown) {
    try {
      logger.info("GetUploadUrlService: starting...");
      const data = schema.parse(input);
      if (!ALLOWED_TYPES.has(data.contentType)) throw new Error("Content type not allowed.");
      const maxBytes = env.UPLOAD_MAX_MB * 1024 * 1024;
      if (data.contentLength !== undefined && data.contentLength > maxBytes) {
        throw new Error(`File too large. Max ${env.UPLOAD_MAX_MB}MB.`);
      }
      const role = await this.membershipRepository.findRole(userId, data.organizationId);
      if (!role) throw new Error("Forbidden");
      const safe = sanitizeFileName(data.fileName);
      if (!safe || safe.includes("..")) throw new Error("Invalid file name.");
      const key = `orgs/${data.organizationId}/${Date.now().toString(36)}-${safe}`;
      const result = await this.storageAdapter.getUploadUrl({ key, contentType: data.contentType, contentLength: data.contentLength });
      logger.info("GetUploadUrlService: completed");
      return { ...result, key };
    } catch (err) {
      logger.error(`GetUploadUrlService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

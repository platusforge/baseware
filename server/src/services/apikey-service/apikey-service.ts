import { z } from "zod";
import { logger } from "@/logger";
import { IApiKeyRepository, IAuditRepository } from "@/types/repositories/saas-repositories";
import { randomToken, sha256 } from "@/lib/crypto";

const createKeySchema = z.object({
  name: z.string().trim().min(2).max(60),
  organizationId: z.string().uuid().optional(),
  scopes: z.array(z.string().max(40)).max(20).default([]),
  expiresAt: z.coerce.date().optional(),
});

export class CreateApiKeyService {
  constructor(
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly auditRepository: IAuditRepository,
  ) {}

  async execute(userId: string, input: unknown) {
    try {
      logger.info("CreateApiKeyService: starting...");
      const data = createKeySchema.parse(input);
      const prefix = `sk_${randomToken(4)}`;
      const secret = randomToken(24);
      const raw = `${prefix}.${secret}`;
      await this.apiKeyRepository.create({ userId, organizationId: data.organizationId, name: data.name, keyPrefix: prefix, keyHash: sha256(raw), scopes: data.scopes });
      await this.auditRepository.append({ userId, organizationId: data.organizationId, action: "apikey.created", entity: "api-key" });
      logger.info("CreateApiKeyService: completed");
      return { apiKey: raw, prefix };
    } catch (err) {
      logger.error(`CreateApiKeyService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class ListApiKeysService {
  constructor(private readonly apiKeyRepository: IApiKeyRepository) {}

  async execute(userId: string) {
    try {
      logger.info("ListApiKeysService: starting...");
      const keys = await this.apiKeyRepository.list(userId);
      logger.info("ListApiKeysService: completed");
      return keys;
    } catch (err) {
      logger.error(`ListApiKeysService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class RevokeApiKeyService {
  constructor(private readonly apiKeyRepository: IApiKeyRepository) {}

  async execute(userId: string, id: string) {
    try {
      logger.info("RevokeApiKeyService: starting...");
      if (!id) throw new Error("Missing id.");
      await this.apiKeyRepository.revoke(id, userId);
      logger.info("RevokeApiKeyService: completed");
      return { revoked: true };
    } catch (err) {
      logger.error(`RevokeApiKeyService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

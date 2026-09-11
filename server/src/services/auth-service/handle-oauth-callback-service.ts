import { z } from "zod";
import { randomUUID } from "crypto";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";
import {
  IAuditRepository,
  IMembershipRepository,
  IOAuthAccountRepository,
  IOrganizationRepository,
  IRefreshTokenRepository,
} from "@/types/repositories/saas-repositories";
import { IOAuthAdapter } from "@/adapters/adapters";
import { oauthRedirectUri, safeEqual } from "@/lib/oauth";
import { randomToken, slugify } from "@/lib/crypto";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

const callbackSchema = z.object({
  provider: z.enum(["google", "github"]),
  code: z.string().min(1).max(2048),
  queryState: z.string().min(1).max(256),
  storedState: z.string().min(1).max(256),
  codeVerifier: z.string().min(43).max(128),
});

export class HandleOAuthCallbackService {
  constructor(
    private readonly adapters: Record<string, IOAuthAdapter>,
    private readonly oauthAccountRepository: IOAuthAccountRepository,
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly auditRepository: IAuditRepository,
  ) {}

  async execute(input: unknown) {
    try {
      logger.info("HandleOAuthCallbackService: starting...");
      const data = callbackSchema.parse(input);
      if (!safeEqual(data.queryState, data.storedState)) throw new Error("Invalid OAuth state.");

      const adapter = this.adapters[data.provider];
      if (!adapter || !adapter.isConfigured()) throw new Error("OAuth provider not configured.");

      const profile = await adapter.exchangeCode({
        code: data.code,
        codeVerifier: data.codeVerifier,
        redirectUri: oauthRedirectUri(data.provider),
      });
      if (!profile.email) throw new Error("OAuth profile incomplete.");

      const linked = await this.oauthAccountRepository.findByProvider(data.provider, profile.providerId);
      let userId: string;
      let isNewUser = false;

      if (linked) {
        const user = (await this.userRepository.findById(linked.userId)) as { id: string; active: boolean } | null;
        if (!user || user.active === false) throw new Error("Invalid credentials.");
        userId = user.id;
      } else {
        const existing = (await this.userRepository.findByEmail(profile.email)) as {
          id: string; active: boolean; emailVerifiedAt: Date | null } | null;
        if (existing) {
          if (existing.active === false) throw new Error("Invalid credentials.");
          if (!profile.emailVerified) {
            logger.warn(`HandleOAuthCallbackService: unverified collision provider=${data.provider}`);
            throw new Error("An account with this email already exists. Log in to link.");
          }
          await this.oauthAccountRepository.create({
            userId: existing.id,
            provider: data.provider,
            providerId: profile.providerId,
            email: profile.email,
          });
          await this.userRepository.update(existing.id, { emailVerifiedAt: new Date() });
          userId = existing.id;
        } else {
          const name = profile.name ?? profile.email.split("@")[0];
          const created = await this.userRepository.create({
            email: profile.email,
            name,
            avatarUrl: profile.avatarUrl,
            emailVerifiedAt: profile.emailVerified ? new Date() : undefined,
          });
          await this.oauthAccountRepository.create({
            userId: created.id,
            provider: data.provider,
            providerId: profile.providerId,
            email: profile.email,
          });
          const org = await this.organizationRepository.create({
            name: `${name}'s workspace`,
            slug: `${slugify(name)}-${randomToken(4)}`,
          });
          await this.membershipRepository.add({ userId: created.id, organizationId: org.id, role: "owner" });
          await this.auditRepository.append({ userId: created.id, organizationId: org.id, action: "user.oauth_signup", entity: "user", entityId: created.id });
          userId = created.id;
          isNewUser = true;
        }
      }

      const family = randomUUID();
      const refreshJti = randomUUID();
      const accessToken = signAccessToken(userId, randomUUID());
      const refreshToken = signRefreshToken(userId, refreshJti);
      await this.refreshTokenRepository.create({ userId, jti: refreshJti, family, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) });
      await this.userRepository.update(userId, { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() });
      logger.info("HandleOAuthCallbackService: completed");
      return { accessToken, refreshToken, isNewUser };
    } catch (err) {
      logger.error(`HandleOAuthCallbackService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

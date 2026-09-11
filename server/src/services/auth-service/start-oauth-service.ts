import { z } from "zod";
import { logger } from "@/logger";
import { IOAuthAdapter } from "@/adapters/adapters";
import { codeChallenge, newCodeVerifier, newOAuthState, oauthRedirectUri } from "@/lib/oauth";

const startSchema = z.object({
  provider: z.enum(["google", "github"]),
});

export class StartOAuthService {
  constructor(private readonly adapters: Record<string, IOAuthAdapter>) {}

  async execute(input: unknown) {
    try {
      logger.info("StartOAuthService: starting...");
      const data = startSchema.parse(input);
      const adapter = this.adapters[data.provider];
      if (!adapter || !adapter.isConfigured()) throw new Error("OAuth provider not configured.");
      const state = newOAuthState();
      const codeVerifier = newCodeVerifier();
      const redirectUri = oauthRedirectUri(data.provider);
      const url = adapter.getAuthorizationUrl({ state, codeChallenge: codeChallenge(codeVerifier), redirectUri });
      logger.info("StartOAuthService: completed");
      return { provider: data.provider, url, state, codeVerifier, redirectUri };
    } catch (err) {
      logger.error(`StartOAuthService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

import { env } from "@/env";
import { IOAuthAdapter, OAuthProfile } from "../adapters";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export class GoogleOAuthAdapter implements IOAuthAdapter {
  provider = "google" as const;

  isConfigured(): boolean {
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  }

  getAuthorizationUrl(data: { state: string; codeChallenge: string; redirectUri: string }): string {
    if (!this.isConfigured()) throw new Error("OAuth provider not configured.");
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: data.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state: data.state,
      code_challenge: data.codeChallenge,
      code_challenge_method: "S256",
      access_type: "online",
      prompt: "select_account",
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  async exchangeCode(data: { code: string; codeVerifier: string; redirectUri: string }): Promise<OAuthProfile> {
    const body = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code: data.code,
      code_verifier: data.codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: data.redirectUri,
    });
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!tokenRes.ok) throw new Error("OAuth code exchange failed.");
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) throw new Error("OAuth code exchange failed.");

    const infoRes = await fetch(USERINFO_URL, {
      signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) throw new Error("OAuth profile fetch failed.");
    const info = (await infoRes.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };
    if (!info.sub || !info.email) throw new Error("OAuth profile incomplete.");
    return {
      providerId: info.sub,
      email: info.email.toLowerCase(),
      emailVerified: info.email_verified === true,
      name: info.name,
      avatarUrl: info.picture,
    };
  }
}


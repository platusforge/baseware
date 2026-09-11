import { env } from "@/env";
import { IOAuthAdapter, OAuthProfile } from "../adapters";

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";
const EMAILS_URL = "https://api.github.com/user/emails";

export class GitHubOAuthAdapter implements IOAuthAdapter {
  provider = "github" as const;

  isConfigured(): boolean {
    return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
  }

  getAuthorizationUrl(data: { state: string; codeChallenge: string; redirectUri: string }): string {
    if (!this.isConfigured()) throw new Error("OAuth provider not configured.");
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: data.redirectUri,
      scope: "read:user user:email",
      state: data.state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  async exchangeCode(data: { code: string; codeVerifier: string; redirectUri: string }): Promise<OAuthProfile> {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: data.code,
        redirect_uri: data.redirectUri,
      }),
    });
    if (!tokenRes.ok) throw new Error("OAuth code exchange failed.");
    const tokens = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokens.access_token) throw new Error("OAuth code exchange failed.");

    const headers = { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "saas-boilerplate" };
    const [userRes, emailsRes] = await Promise.all([fetch(USER_URL, { headers }), fetch(EMAILS_URL, { headers })]);
    if (!userRes.ok || !emailsRes.ok) throw new Error("OAuth profile fetch failed.");
    const user = (await userRes.json()) as { id?: number; name?: string; avatar_url?: string };
    const emails = (await emailsRes.json()) as { email?: string; primary?: boolean; verified?: boolean }[];
    const primary = emails.find((e) => e.primary) ?? emails[0];
    if (!user.id || !primary?.email) throw new Error("OAuth profile incomplete.");
    return {
      providerId: String(user.id),
      email: primary.email.toLowerCase(),
      emailVerified: primary.verified === true,
      name: user.name,
      avatarUrl: user.avatar_url,
    };
  }
}

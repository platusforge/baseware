import { IMailAdapter, IBillingAdapter, IStorageAdapter, IOAuthAdapter, OAuthProviderName } from "./adapters";
import { NodemailerMailAdapter } from "./nodemailer/nodemailer-mail-adapter";
import { StripeBillingAdapter } from "./stripe/stripe-billing-adapter";
import { S3StorageAdapter } from "./s3/s3-storage-adapter";
import { GoogleOAuthAdapter } from "./oauth/google-oauth-adapter";
import { GitHubOAuthAdapter } from "./oauth/github-oauth-adapter";

export const mailAdapter: IMailAdapter = new NodemailerMailAdapter();
export const billingAdapter: IBillingAdapter = new StripeBillingAdapter();
export const storageAdapter: IStorageAdapter = new S3StorageAdapter();

const oauthAdapters: Record<OAuthProviderName, IOAuthAdapter> = {
  google: new GoogleOAuthAdapter(),
  github: new GitHubOAuthAdapter(),
};

export function getOAuthAdapter(provider: string): IOAuthAdapter {
  const adapter = (oauthAdapters as Record<string, IOAuthAdapter>)[provider];
  if (!adapter) throw new Error("Unsupported OAuth provider.");
  return adapter;
}

export function listOAuthProviders(): { provider: OAuthProviderName; configured: boolean }[] {
  return (Object.keys(oauthAdapters) as OAuthProviderName[]).map((provider) => ({
    provider,
    configured: oauthAdapters[provider].isConfigured(),
  }));
}

export function getOAuthAdapters(): Record<OAuthProviderName, IOAuthAdapter> {
  return oauthAdapters;
}

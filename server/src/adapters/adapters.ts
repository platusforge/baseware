export type IMailAdapter = {
  sendMail: (data: { to: string; subject: string; html: string }) => Promise<void>;
};

export type NormalizedWebhookEvent = {
  id: string;
  type: string;
  data: {
    subscriptionId?: string;
    customerId?: string;
    status?: string;
    priceId?: string;
    seats?: number;
    /** Unix seconds, as sent by Stripe. */
    periodEnd?: number;
    organizationId?: string;
    customerEmail?: string;
  };
};

export type SubscriptionDetails = {
  status: string;
  priceId?: string;
  seats: number;
  periodEnd: number | null;
  customerId?: string;
};

export type IBillingAdapter = {
  createCheckoutSession: (data: { organizationId: string; customerId?: string; email: string; priceId: string; successUrl: string; cancelUrl: string }) => Promise<{ url: string }>;
  createPortalSession: (data: { stripeCustomerId: string; returnUrl: string }) => Promise<{ url: string }>;
  constructWebhookEvent: (rawBody: Buffer, signature: string) => NormalizedWebhookEvent;
  ensureCustomer: (data: { organizationId: string; email: string; name: string }) => Promise<string>;
  getSubscriptionDetails: (subscriptionId: string) => Promise<SubscriptionDetails | null>;
};

export type IStorageAdapter = {
  getUploadUrl: (data: { key: string; contentType: string }) => Promise<{ url: string; publicUrl: string }>;
};

export type OAuthProviderName = "google" | "github";

export type OAuthProfile = {
  providerId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  avatarUrl?: string;
};

export type IOAuthAdapter = {
  provider: OAuthProviderName;
  isConfigured: () => boolean;
  getAuthorizationUrl: (data: { state: string; codeChallenge: string; redirectUri: string }) => string;
  exchangeCode: (data: { code: string; codeVerifier: string; redirectUri: string }) => Promise<OAuthProfile>;
};

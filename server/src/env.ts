import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().default("saas-boilerplate"),
  JWT_AUDIENCE: z.string().default("saas-boilerplate-web"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  COOKIE_DOMAIN: z.string().optional(),
  SERVER_PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  API_PUBLIC_URL: z.string().default("http://localhost:3000"),
  BCRYPT_COST: z.coerce.number().default(12),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(10),
  RESET_RATE_LIMIT_MAX: z.coerce.number().default(3),
  REGISTER_RATE_LIMIT_MAX: z.coerce.number().default(20),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PRICE_STARTER: z.string().optional().default(""),
  STRIPE_PRICE_PRO: z.string().optional().default(""),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GITHUB_CLIENT_ID: z.string().optional().default(""),
  GITHUB_CLIENT_SECRET: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("no-reply@example.com"),
  RESEND_API_KEY: z.string().optional().default(""),
  S3_ENDPOINT: z.string().optional().default(""),
  S3_BUCKET: z.string().optional().default(""),
  S3_ACCESS_KEY: z.string().optional().default(""),
  S3_SECRET_KEY: z.string().optional().default(""),
  S3_REGION: z.string().optional().default("us-east-1"),
  S3_PUBLIC_BASE_URL: z.string().optional().default(""),
  UPLOAD_MAX_MB: z.coerce.number().default(10),
  APP_HOST: z.string().optional().default("app.example.com"),
  REDIS_URL: z.string().optional().default(""),
  RATE_LIMIT_STORE: z.string().optional().default("memory"),
  REQUIRE_VERIFIED_EMAIL: z.coerce.boolean().default(true),
  TRIAL_DAYS: z.coerce.number().default(14),
  SENTRY_DSN: z.string().optional().default(""),
  POSTHOG_KEY: z.string().optional().default(""),
  LOG_LEVEL: z.string().default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// The placeholder shipped in .env.example is public. Refuse to boot
// production with a compromised secret.
if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_SECRET.includes("change-me")) {
  console.error("Refusing to boot: JWT_SECRET still uses the public placeholder. Generate one with: openssl rand -base64 48");
  process.exit(1);
}

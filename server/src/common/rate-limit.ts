import rateLimit from "express-rate-limit";
import { env } from "@/env";
import { logger } from "@/logger";

// Distributed store when REDIS_URL is set (multi-replica prod).
// Falls back to in-memory for single-VPS/dev with an explicit warn in prod.
function buildStore(prefix: string) {
  if (!env.REDIS_URL) {
    if (env.NODE_ENV === "production") {
      logger.warn(`rate-limit: using in-memory store for ${prefix} (single-replica only). Set REDIS_URL for multi-replica.`);
    }
    return undefined;
  }
  try {
    // Lazy require so tests without redis still pass.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require("ioredis");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RedisStore } = require("rate-limit-redis");
    const client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, enableReadyCheck: false });
    client.on("error", (err: unknown) => logger.error(`redis error: ${err instanceof Error ? err.message : err}`));
    return new RedisStore({ sendCommand: (...args: string[]) => (client.call as (...a: string[]) => Promise<unknown>)(...args), prefix });
  } catch (err) {
    logger.error(`rate-limit: redis init failed, falling back to memory: ${err instanceof Error ? err.message : err}`);
    return undefined;
  }
}

function limiter(opts: { windowMs: number; max: number; prefix: string }) {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many requests" },
    ...(buildStore(opts.prefix) ? { store: buildStore(opts.prefix) as never } : {}),
  });
}

export const loginRateLimit = limiter({ windowMs: 15 * 60 * 1000, max: env.LOGIN_RATE_LIMIT_MAX, prefix: "rl:login:" });

export const resetRateLimit = limiter({ windowMs: 60 * 60 * 1000, max: env.RESET_RATE_LIMIT_MAX, prefix: "rl:reset:" });

export const registerRateLimit = limiter({ windowMs: 60 * 60 * 1000, max: env.REGISTER_RATE_LIMIT_MAX, prefix: "rl:register:" });

export const oauthRateLimit = limiter({ windowMs: 15 * 60 * 1000, max: 30, prefix: "rl:oauth:" });

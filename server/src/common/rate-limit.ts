import rateLimit from "express-rate-limit";
import { env } from "@/env";

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests" },
});

export const resetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.RESET_RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests" },
});

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.REGISTER_RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests" },
});

export const oauthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests" },
});

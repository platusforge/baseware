import jwt from "jsonwebtoken";
import { env } from "@/env";

export type AccessPayload = { sub: string; jti: string; iat?: number };

const TTL_RE = /^(\d+)\s*([smhd])$/i;
const TTL_MULT: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** Parse "15m" / "7d" / "30s" / "2h" into milliseconds. Falls back when invalid. */
export function ttlToMs(ttl: string, fallbackMs: number): number {
  const match = ttl.trim().match(TTL_RE);
  if (!match) return fallbackMs;
  return Number(match[1]) * (TTL_MULT[match[2].toLowerCase()] ?? 0) || fallbackMs;
}

export function accessCookieMaxAge(): number {
  return ttlToMs(env.ACCESS_TOKEN_TTL, 15 * 60 * 1000);
}

export function refreshCookieMaxAge(): number {
  return ttlToMs(env.REFRESH_TOKEN_TTL, 7 * 24 * 3600 * 1000);
}

export function signAccessToken(userId: string, jti: string): string {
  return jwt.sign({ sub: userId, jti }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
}

export function signRefreshToken(userId: string, jti: string): string {
  return jwt.sign({ sub: userId, jti }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
}

export function verifyToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  }) as AccessPayload;
}

const VERIFY_TTL = "24h";

export function signVerifyToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email, type: "email-verify" }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: VERIFY_TTL,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
}

export function verifyVerifyToken(token: string): { sub: string; email: string } {
  const payload = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  }) as { sub: string; email: string; type: string };
  if (payload.type !== "email-verify" || !payload.sub || !payload.email) {
    throw new Error("Invalid verification token.");
  }
  return { sub: payload.sub, email: payload.email };
}

import jwt from "jsonwebtoken";
import { env } from "@/env";

export type AccessPayload = { sub: string; jti: string };

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

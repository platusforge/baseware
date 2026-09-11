import crypto from "crypto";
import { env } from "@/env";

/** PKCE (RFC 7636, S256) + state helpers for the OAuth authorization-code flow. */

export function newCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function codeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function newOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function oauthRedirectUri(provider: string): string {
  return `${env.API_PUBLIC_URL.replace(/\/$/, "")}/auth/oauth/${provider}/callback`;
}

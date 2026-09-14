import crypto from "crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function newMfaSecret(bytes = 20): string {
  const buf = crypto.randomBytes(bytes);
  let out = "";
  let bits = 0;
  let value = 0;
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx === -1) throw new Error("Invalid secret.");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number): number {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = h[h.length - 1] & 0x0f;
  const code = ((h[offset] & 0x7f) << 24) | ((h[offset + 1] & 0xff) << 16) | ((h[offset + 2] & 0xff) << 8) | (h[offset + 3] & 0xff);
  return code % 1_000_000;
}

/** TOTP verify with ±1 step window (30s steps). Constant-time compare. */
export function verifyTotp(secret: string, token: string, window = 1): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const step = Math.floor(Date.now() / 30_000);
  for (let i = -window; i <= window; i += 1) {
    const expected = String(hotp(secret, step + i)).padStart(6, "0");
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))) return true;
  }
  return false;
}

export function otpauthUrl(secret: string, email: string, issuer = "SaaS Boilerplate"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
}

export function newBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => crypto.randomBytes(6).toString("hex"));
}

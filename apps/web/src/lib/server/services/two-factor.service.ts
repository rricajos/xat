import { createHmac, randomBytes } from "node:crypto";
import { db } from "@xat/db";
import { users } from "@xat/db/schema";
import { eq } from "drizzle-orm";

// TOTP implementation (RFC 6238) using HMAC-SHA1
// Compatible with Google Authenticator, Authy, etc.

function base32Decode(str: string): Buffer {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = str.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  let output = 0;
  const bytes: number[] = [];

  for (const char of cleaned) {
    const idx = CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function base32Encode(buf: Buffer): string {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += CHARS[(value << (5 - bits)) & 31];
  while (output.length % 8 !== 0) output += "=";
  return output;
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = tmp & 0xff;
    tmp = tmp >>> 8;
  }
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[19]! & 0xf;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function getTotpCode(secret: string, time = Date.now()): string {
  const counter = Math.floor(time / 30_000);
  return hotp(secret, counter);
}

export function verifyTotpCode(secret: string, code: string, time = Date.now()): boolean {
  const counter = Math.floor(time / 30_000);
  // Allow ±1 window (30s drift tolerance)
  for (const delta of [-1, 0, 1]) {
    if (hotp(secret, counter + delta) === code) return true;
  }
  return false;
}

export function getTotpUri(secret: string, email: string, issuer = "Xat"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export async function enable2FA(userId: number, secret: string) {
  await db.update(users).set({ twoFactorSecret: secret, twoFactorEnabled: true, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function disable2FA(userId: number) {
  await db.update(users).set({ twoFactorSecret: null, twoFactorEnabled: false, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function getUserTwoFactor(userId: number) {
  const [user] = await db
    .select({ twoFactorEnabled: users.twoFactorEnabled, twoFactorSecret: users.twoFactorSecret })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}

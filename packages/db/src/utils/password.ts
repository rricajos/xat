import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export async function hash(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derived = await deriveKey(password, salt);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verify(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = await deriveKey(password, salt);
  const storedBuffer = Buffer.from(key, "hex");
  return timingSafeEqual(derived, storedBuffer);
}

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

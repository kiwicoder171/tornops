import crypto from "node:crypto";
import { maskApiKey } from "@torn/shared";
export { maskApiKey };

const ALGORITHM = "aes-256-gcm";
const DEFAULT_SECRET = process.env.ENCRYPTION_SECRET || "torn_suite_secure_default_master_key_32b!";

function getDerivedKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}


/**
 * Encrypts an API key string using AES-256-GCM.
 */
export function encryptApiKey(plainKey: string, secret: string = DEFAULT_SECRET): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getDerivedKey(secret), iv);
  
  let encrypted = cipher.update(plainKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted API key payload.
 */
export function decryptApiKey(payload: string, secret: string = DEFAULT_SECRET): string {
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted API key format");
  }

  const [ivHex, authTagHex, encryptedText] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getDerivedKey(secret), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

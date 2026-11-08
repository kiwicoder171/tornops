import crypto from "node:crypto";
import { maskApiKey } from "@torn/shared";
export { maskApiKey };

const ALGORITHM = "aes-256-gcm";
const HKDF_INFO = "tornops-api-key-v1";

const KNOWN_DEFAULT_SECRETS = new Set([
  "torn_suite_secure_default_master_key_32b!",
  "default",
  "change_me",
  "change-me",
  "secret",
  "password",
  "admin",
]);

/**
 * Validates and retrieves the encryption master secret.
 * Throws an explicit fatal error if missing, empty, shorter than 32 characters,
 * or matching known default fallback strings.
 */
export function validateAndGetSecret(explicitSecret?: string): string {
  const candidate = explicitSecret !== undefined ? explicitSecret : process.env.ENCRYPTION_SECRET;
  if (!candidate || candidate.trim() === "") {
    throw new Error(
      "FATAL: ENCRYPTION_SECRET environment variable is missing or empty. Set a cryptographically secure 32+ character secret."
    );
  }

  const trimmed = candidate.trim();
  if (KNOWN_DEFAULT_SECRETS.has(trimmed) || trimmed.toLowerCase().includes("default_master_key")) {
    throw new Error(
      "FATAL: Insecure default ENCRYPTION_SECRET detected. You must provide a unique production secret."
    );
  }

  if (trimmed.length < 32) {
    throw new Error(
      `FATAL: ENCRYPTION_SECRET is too short (${trimmed.length} characters). Minimum 32 characters required for AES-256 key derivation.`
    );
  }

  return trimmed;
}

/**
 * Derives a 256-bit (32-byte) key using HKDF-SHA256.
 */
export function deriveKeyHkdf(secret: string, salt: Buffer, info: string = HKDF_INFO): Buffer {
  return Buffer.from(crypto.hkdfSync("sha256", secret, salt, info, 32));
}

/**
 * Encrypts an API key string using AES-256-GCM and HKDF key derivation.
 * Returns payload formatted as: saltHex:ivHex:authTagHex:encryptedHex (4 parts).
 */
export function encryptApiKey(plainKey: string, secret?: string): string {
  const masterSecret = validateAndGetSecret(secret);
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKeyHkdf(masterSecret, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted API key payload.
 * Supports both 4-part format (salt:iv:authTag:encrypted) and legacy 3-part format.
 */
export function decryptApiKey(payload: string, secret?: string): string {
  const masterSecret = validateAndGetSecret(secret);
  const parts = payload.split(":");

  if (parts.length === 4) {
    const [saltHex, ivHex, authTagHex, encryptedText] = parts;
    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = deriveKeyHkdf(masterSecret, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  if (parts.length === 3) {
    const [ivHex, authTagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    // Attempt HKDF with deterministic fallback salt first
    try {
      const fallbackSalt = Buffer.from("tornops-api-salt", "utf8");
      const key = deriveKeyHkdf(masterSecret, fallbackSalt);
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      // Fallback to legacy single-round SHA-256 for backward compatibility with existing databases
      const legacyKey = crypto.createHash("sha256").update(masterSecret).digest();
      const decipher = crypto.createDecipheriv(ALGORITHM, legacyKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }
  }

  throw new Error("Invalid encrypted API key format: expected 4 parts (salt:iv:authTag:ciphertext) or legacy 3 parts");
}


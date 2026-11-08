import test from "node:test";
import assert from "node:assert/strict";
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
} from "../dist/crypto-key.js";
import { TornRateLimiter } from "../dist/rate-limiter.js";

// Provide hermetic test secret for tests
process.env.ENCRYPTION_SECRET = "test_hermetic_secret_key_32_characters_minimum!";

test("API Key Encryption and Masking with HKDF", () => {
  const secretKey = "test_torn_api_key_12345678";
  const masked = maskApiKey(secretKey);
  assert.equal(masked, "test...5678");

  const encrypted = encryptApiKey(secretKey);
  assert.notEqual(encrypted, secretKey);
  // Verify 4-part HKDF format: salt:iv:authTag:ciphertext
  const parts = encrypted.split(":");
  assert.equal(parts.length, 4);

  const decrypted = decryptApiKey(encrypted);
  assert.equal(decrypted, secretKey);
});

test("Encryption throws fatal error on missing, short, or banned default secrets", () => {
  const originalSecret = process.env.ENCRYPTION_SECRET;
  try {
    // Missing / empty secret
    delete process.env.ENCRYPTION_SECRET;
    assert.throws(
      () => encryptApiKey("any_key"),
      /FATAL: ENCRYPTION_SECRET environment variable is missing/
    );

    // Static default fallback rejected
    process.env.ENCRYPTION_SECRET = "torn_suite_secure_default_master_key_32b!";
    assert.throws(
      () => encryptApiKey("any_key"),
      /FATAL: Insecure default ENCRYPTION_SECRET detected/
    );

    // Too short secret (< 32 characters) rejected
    process.env.ENCRYPTION_SECRET = "too_short_key_under_32";
    assert.throws(
      () => encryptApiKey("any_key"),
      /FATAL: ENCRYPTION_SECRET is too short/
    );

    // Explicit secret overrides and works when valid
    const validExplicitSecret = "a_very_secure_custom_explicit_key_32b!";
    const enc = encryptApiKey("my_explicit_test_key", validExplicitSecret);
    const dec = decryptApiKey(enc, validExplicitSecret);
    assert.equal(dec, "my_explicit_test_key");
  } finally {
    process.env.ENCRYPTION_SECRET = originalSecret;
  }
});

test("Rate Limiter throttles and distributes across managed keys", async () => {
  // Set low limit for fast testing: 3 requests per minute
  const limiter = new TornRateLimiter(3);
  limiter.registerKey("key-1", "fake-api-key-1", "FACTION");
  limiter.registerKey("key-2", "fake-api-key-2", "MEMBER");

  assert.equal(limiter.getKeysCount(), 2);

  // Acquire 2 keys - should distribute across key-1 and key-2
  const k1 = await limiter.acquireKey();
  const k2 = await limiter.acquireKey();
  assert.notEqual(k1.id, k2.id);

  const stats = limiter.getPoolStats();
  assert.equal(stats.length, 2);
  assert.equal(stats[0].rollingMinuteUsage, 1);
  assert.equal(stats[1].rollingMinuteUsage, 1);
});

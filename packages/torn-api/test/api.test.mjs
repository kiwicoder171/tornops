import test from "node:test";
import assert from "node:assert/strict";
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
} from "../dist/crypto-key.js";
import { TornRateLimiter } from "../dist/rate-limiter.js";

test("API Key Encryption and Masking", () => {
  const secretKey = "test_torn_api_key_12345678";
  const masked = maskApiKey(secretKey);
  assert.equal(masked, "test...5678");

  const encrypted = encryptApiKey(secretKey);
  assert.notEqual(encrypted, secretKey);
  assert.ok(encrypted.includes(":"));

  const decrypted = decryptApiKey(encrypted);
  assert.equal(decrypted, secretKey);
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

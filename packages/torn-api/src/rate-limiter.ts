import { maskApiKey } from "./crypto-key.js";

export interface ManagedKey {
  id: string;
  key: string;
  type: "FACTION" | "MEMBER";
  timestamps: number[];
  backoffUntil: number;
}

export class TornRateLimiter {
  private keys: Map<string, ManagedKey> = new Map();
  private maxRequestsPerMinute: number;

  constructor(maxRequestsPerMinute: number = 95) {
    // We default to 95 to leave a safe 5% buffer below Torn's strict 100 limit
    this.maxRequestsPerMinute = maxRequestsPerMinute;
  }

  public registerKey(id: string, key: string, type: "FACTION" | "MEMBER"): void {
    if (!this.keys.has(id)) {
      this.keys.set(id, {
        id,
        key,
        type,
        timestamps: [],
        backoffUntil: 0,
      });
    }
  }

  public removeKey(id: string): void {
    this.keys.delete(id);
  }

  public getKeysCount(): number {
    return this.keys.size;
  }

  /**
   * Acquires an available key, waiting if all keys are currently at rate limit.
   */
  public async acquireKey(preferredType?: "FACTION" | "MEMBER"): Promise<ManagedKey> {
    const maxWaitMs = 65000;
    const startWait = Date.now();

    while (Date.now() - startWait < maxWaitMs) {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;

      // Filter eligible keys
      let candidates = Array.from(this.keys.values()).filter((k) => k.backoffUntil <= now);
      if (preferredType) {
        const typeCandidates = candidates.filter((k) => k.type === preferredType);
        if (typeCandidates.length > 0) {
          candidates = typeCandidates;
        }
      }

      if (candidates.length === 0) {
        // All keys are currently in backoff, wait 1 second
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      // Clean old timestamps outside the rolling 60-second window
      for (const k of candidates) {
        k.timestamps = k.timestamps.filter((t) => t > oneMinuteAgo);
      }

      // Sort by least number of requests in the current window
      candidates.sort((a, b) => a.timestamps.length - b.timestamps.length);
      const bestKey = candidates[0];

      if (bestKey.timestamps.length < this.maxRequestsPerMinute) {
        bestKey.timestamps.push(now);
        return bestKey;
      }

      // Rate limit reached for best key: calculate delay until its oldest request expires
      const oldestTimestamp = bestKey.timestamps[0];
      const waitTime = Math.max(100, oldestTimestamp + 60000 - now + 50);
      await new Promise((r) => setTimeout(r, Math.min(waitTime, 2000)));
    }

    throw new Error("Rate limiter timeout: All API keys exhausted their capacity");
  }

  /**
   * Triggers exponential backoff for a key when encountering HTTP 429 or Torn Error 5.
   */
  public handleRateLimitExceeded(keyId: string, backoffSeconds: number = 30): void {
    const key = this.keys.get(keyId);
    if (key) {
      key.backoffUntil = Date.now() + backoffSeconds * 1000;
      console.warn(
        `[RateLimiter] Key ${maskApiKey(key.key)} backed off for ${backoffSeconds}s due to rate limit`
      );
    }
  }

  /**
   * Returns current statistics across the key pool.
   */
  public getPoolStats(): Array<{ id: string; type: string; rollingMinuteUsage: number; inBackoff: boolean }> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    return Array.from(this.keys.values()).map((k) => {
      const activeTimestamps = k.timestamps.filter((t) => t > oneMinuteAgo);
      return {
        id: k.id,
        type: k.type,
        rollingMinuteUsage: activeTimestamps.length,
        inBackoff: k.backoffUntil > now,
      };
    });
  }
}

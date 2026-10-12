import { TornRateLimiter } from "./rate-limiter.js";
import { maskApiKey } from "./crypto-key.js";
import {
  ChainStatus,
  RankedWarData,
  AttackRecord,
  VaultDepositLog,
  TornUser,
  FactionMember,
} from "@torn/shared";

export interface TornApiOptions {
  rateLimiter?: TornRateLimiter;
  baseUrl?: string;
}

export interface TornErrorResponse {
  error: {
    code: number;
    error: string;
  };
}

export class TornApiClient {
  private rateLimiter: TornRateLimiter;
  private baseUrl: string;
  private cache: Map<string, { data: unknown; expiresAt: number }> = new Map();

  constructor(options: TornApiOptions = {}) {
    this.rateLimiter = options.rateLimiter || new TornRateLimiter();
    this.baseUrl = options.baseUrl || "https://api.torn.com/v2";
  }

  public getRateLimiter(): TornRateLimiter {
    return this.rateLimiter;
  }

  /**
   * Internal request executor using the rate limiter and managed key pool.
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string | number> = {},
    preferredKeyType?: "FACTION" | "MEMBER",
    cacheTtlSeconds: number = 0
  ): Promise<T> {
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    if (cacheTtlSeconds > 0) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data as T;
      }
    }

    const key = await this.rateLimiter.acquireKey(preferredKeyType);
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set("key", key.key);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }

    try {
      const res = await fetch(url.toString(), {
        headers: {
          "Accept": "application/json",
          "User-Agent": "TornFactionOperationsSuite/1.0",
        },
      });

      if (res.status === 429) {
        this.rateLimiter.handleRateLimitExceeded(key.id, 60);
        throw new Error(`HTTP 429 Rate Limit Exceeded on key ${maskApiKey(key.key)}`);
      }

      if (!res.ok) {
        throw new Error(`Torn API HTTP Error: ${res.status} ${res.statusText}`);
      }

      const json = (await res.json()) as T & TornErrorResponse;

      if ("error" in (json as Record<string, unknown>)) {
        const err = (json as TornErrorResponse).error;
        if (err.code === 5) {
          // Too many requests error code from Torn API
          this.rateLimiter.handleRateLimitExceeded(key.id, 60);
        }
        throw new Error(`Torn API Error [${err.code}]: ${err.error}`);
      }

      if (cacheTtlSeconds > 0) {
        this.cache.set(cacheKey, {
          data: json,
          expiresAt: Date.now() + cacheTtlSeconds * 1000,
        });
      }

      return json;
    } catch (err) {
      throw err;
    }
  }

  // --- Chain & War Endpoints ---

  /**
   * Fetches current faction chain status.
   */
  public async getChainStatus(factionId?: number): Promise<ChainStatus> {
    const params: Record<string, string | number> = { selections: "chain" };
    if (factionId) params.id = factionId;

    const data = await this.request<{ chain: ChainStatus }>("/faction", params, "FACTION", 2);
    return data.chain;
  }

  /**
   * Fetches active Ranked War information.
   */
  public async getRankedWars(factionId?: number): Promise<RankedWarData | null> {
    const params: Record<string, string | number> = { selections: "rankedwars" };
    if (factionId) params.id = factionId;

    const data = await this.request<{ rankedwars?: Record<string, RankedWarData> }>(
      "/faction",
      params,
      "FACTION",
      3
    );

    if (!data.rankedwars) return null;
    const wars = Object.values(data.rankedwars);
    return wars.length > 0 ? wars[0] : null;
  }

  /**
   * Fetches faction member roster with live status (hospital, traveling, etc.).
   */
  public async getFactionMembers(factionId?: number): Promise<FactionMember[]> {
    const params: Record<string, string | number> = { selections: "basic" };
    if (factionId) params.id = factionId;

    const data = await this.request<{ members?: Record<string, FactionMember> }>(
      "/faction",
      params,
      "FACTION",
      5
    );

    if (!data.members) return [];
    return Object.entries(data.members).map(([id, m]) => ({
      ...m,
      id: Number(id),
    }));
  }

  /**
   * Fetches full war report after ranked war conclusion.
   */
  public async getRankedWarReport(warId: number): Promise<unknown> {
    return this.request(
      "/faction/rankedwarreport",
      { id: warId },
      "FACTION",
      300 // Cache for 5 minutes
    );
  }

  /**
   * Fetches full attack logs for payout calculation.
   */
  public async getFactionAttacks(): Promise<AttackRecord[]> {
    const data = await this.request<{ attacks?: Record<string, AttackRecord> }>(
      "/faction",
      { selections: "attacksfull" },
      "FACTION",
      30
    );

    if (!data.attacks) return [];
    return Object.values(data.attacks);
  }

  // --- Faction Banking & Vault Endpoints ---

  /**
   * Fetches recent faction funds log (`fundsnews`) to track member deposits.
   */
  public async getVaultDeposits(): Promise<VaultDepositLog[]> {
    const data = await this.request<{ fundsnews?: Record<string, { news: string; timestamp: number }> }>(
      "/faction",
      { selections: "fundsnews" },
      "FACTION",
      30
    );

    if (!data.fundsnews) return [];

    const parsedDeposits: VaultDepositLog[] = [];
    // Example Torn log format: "<a href=profiles.php?XID=12345>PlayerName</a> deposited $1,000,000 into the faction vault."
    const depositRegex = /profiles\.php\?XID=(\d+)>([^<]+)<\/a> deposited \$([\d,]+)/i;

    for (const [id, item] of Object.entries(data.fundsnews)) {
      const match = item.news.match(depositRegex);
      if (match) {
        const playerId = parseInt(match[1], 10);
        const playerName = match[2];
        const amount = parseInt(match[3].replace(/,/g, ""), 10);

        parsedDeposits.push({
          id: parseInt(id, 10),
          timestamp: item.timestamp,
          playerId,
          playerName,
          amount,
          type: "money",
        });
      }
    }

    return parsedDeposits;
  }

  // --- User Profile & Enemy Info Endpoints ---

  /**
   * Fetches a player's public profile data (using pooled member keys to save faction rate limit).
   */
  public async getUserProfile(userId: number): Promise<TornUser> {
    const data = await this.request<TornUser>(
      "/user",
      { selections: "profile", id: userId },
      "MEMBER",
      10
    );
    return data;
  }
}

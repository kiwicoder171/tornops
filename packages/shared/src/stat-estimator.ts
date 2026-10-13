export interface BattleStatEstimate {
  min: number;
  max: number;
  label: string;
  tier: "UNDERDOG" | "ROOKIE" | "MID_TIER" | "WAR_READY" | "HEAVY" | "APEX" | "TITAN";
  color: string;
  badge: string;
}

export interface PlayerSpyData {
  playerId: number;
  name?: string;
  strength?: number;
  defense?: number;
  speed?: number;
  dexterity?: number;
  total?: number;
  timestamp: number; // Unix timestamp in seconds
  source: "TORNSTATS" | "FACTION_SPY" | "MANUAL" | "FAIR_FIGHT";
  spiedBy?: string;
}

/**
 * Formats large stat numbers into readable gaming abbreviations (e.g. 155.4M, 1.25B)
 */
export function formatStatNumber(num: number): string {
  if (num >= 1_000_000_000_000) {
    return `${(num / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}k`;
  }
  return num.toLocaleString();
}

/**
 * Algorithmic Battle Stat Estimator
 * Uses level, estimated training curve, and combat thresholds to estimate stat ranges.
 */
export function estimateBattleStats(level: number, ageDays: number = 365): BattleStatEstimate {
  // Torn level-to-stat heuristic curve
  if (level <= 15) {
    return {
      min: 5_000,
      max: 150_000,
      label: "Under 150k",
      tier: "UNDERDOG",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      badge: "VERY LOW STATS",
    };
  }

  if (level <= 25) {
    const min = Math.max(100_000, level * 20_000);
    const max = Math.min(2_500_000, Math.max(min * 3, ageDays * 3_000));
    return {
      min,
      max,
      label: `${formatStatNumber(min)} – ${formatStatNumber(max)}`,
      tier: "ROOKIE",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      badge: "LOW STATS",
    };
  }

  if (level <= 40) {
    const min = Math.max(2_000_000, (level - 20) * 1_000_000);
    const max = Math.min(25_000_000, Math.max(min * 4, ageDays * 25_000));
    return {
      min,
      max,
      label: `${formatStatNumber(min)} – ${formatStatNumber(max)}`,
      tier: "MID_TIER",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      badge: "MID STATS",
    };
  }

  if (level <= 55) {
    const min = Math.max(20_000_000, (level - 35) * 4_000_000);
    const max = Math.min(120_000_000, Math.max(min * 4, ageDays * 80_000));
    return {
      min,
      max,
      label: `${formatStatNumber(min)} – ${formatStatNumber(max)}`,
      tier: "WAR_READY",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      badge: "WAR READY",
    };
  }

  if (level <= 70) {
    const min = Math.max(80_000_000, (level - 50) * 15_000_000);
    const max = Math.min(500_000_000, Math.max(min * 3.5, ageDays * 250_000));
    return {
      min,
      max,
      label: `${formatStatNumber(min)} – ${formatStatNumber(max)}`,
      tier: "HEAVY",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      badge: "HEAVY HITTER",
    };
  }

  if (level <= 85) {
    const min = 350_000_000;
    const max = 1_500_000_000;
    return {
      min,
      max,
      label: `${formatStatNumber(min)} – ${formatStatNumber(max)}`,
      tier: "APEX",
      color: "text-red-400 bg-red-500/10 border-red-500/20",
      badge: "APEX COMBATANT",
    };
  }

  // Level 85+ (High-end veterans / Stat Enhancer users)
  return {
    min: 1_000_000_000,
    max: 10_000_000_000,
    label: "1B – 10B+ (SE)",
    tier: "TITAN",
    color: "text-rose-400 bg-rose-500/15 border-rose-500/30",
    badge: "TITAN (AVOID SOLO)",
  };
}

/**
 * Reverse Fair-Fight (FF) calculation.
 * In Torn, Fair Fight is calculated as:
 * FF = 1 + (7/8) * (Defender / Attacker - 1) clamped between 1.00 and 3.00.
 *
 * Given the attacker's total stats and the attack's FF multiplier,
 * this computes the defender's estimated battle stat range.
 */
export function reverseFairFight(
  attackerStats: number,
  fairFight: number
): { min: number; max: number; est: number } {
  if (fairFight <= 1.0) {
    // Defender is weaker than or equal to attacker
    return {
      min: Math.round(attackerStats * 0.05),
      max: attackerStats,
      est: Math.round(attackerStats * 0.5),
    };
  }

  if (fairFight >= 3.0) {
    // Defender is roughly 2.85x or much higher than attacker
    const min = Math.round(attackerStats * (1 + (8 / 7) * 2.0));
    return {
      min,
      max: min * 5,
      est: min * 1.5,
    };
  }

  // Linear range between 1.0 and 3.0
  const ratio = 1 + (8 / 7) * (fairFight - 1);
  const est = Math.round(attackerStats * ratio);
  return {
    min: Math.round(est * 0.85),
    max: Math.round(est * 1.15),
    est,
  };
}

/**
 * Parses freeform copy-pasted spy text from Discord, Torn Chat, or Torn in-game spy reports.
 * Example formats:
 * - "Strength: 45,000,000 Speed: 25,000,000 Defense: 10,000,000 Dexterity: 5,000,000 Total: 85,000,000"
 * - "Apex [12345] Total: 250M"
 * - "45M Str / 12M Def / 50M Spd / 20M Dex (127M)"
 */
export function parseSpyReportText(input: string): Partial<PlayerSpyData> | null {
  if (!input || input.trim() === "") return null;

  const clean = input.replace(/,/g, "").trim();

  // Try to find User ID e.g. [1234567] or (1234567) or XID=1234567
  const idMatch = clean.match(/(?:\[|\(|\bXID=)(\d{4,8})(?:\]|\)|\b)/i);
  const playerId = idMatch ? Number(idMatch[1]) : undefined;

  // Find Player Name
  const nameMatch = clean.match(/^([a-zA-Z0-9_\-\s]{2,20})\s*(?:\[|\()/);
  const name = nameMatch ? nameMatch[1].trim() : undefined;

  const extractNumber = (patterns: RegExp[]): number | undefined => {
    for (const p of patterns) {
      const match = clean.match(p);
      if (match) {
        let val = parseFloat(match[1]);
        const unit = match[2]?.toLowerCase();
        if (unit === "k") val *= 1_000;
        else if (unit === "m") val *= 1_000_000;
        else if (unit === "b") val *= 1_000_000_000;
        else if (unit === "t") val *= 1_000_000_000_000;
        return Math.round(val);
      }
    }
    return undefined;
  };

  const strength = extractNumber([
    /(?:strength|str)[:\s]+([\d.]+)\s*([kmbt])?/i,
    /([\d.]+)\s*([kmbt])?\s*(?:strength|str)\b/i,
  ]);

  const defense = extractNumber([
    /(?:defense|def)[:\s]+([\d.]+)\s*([kmbt])?/i,
    /([\d.]+)\s*([kmbt])?\s*(?:defense|def)\b/i,
  ]);

  const speed = extractNumber([
    /(?:speed|spd)[:\s]+([\d.]+)\s*([kmbt])?/i,
    /([\d.]+)\s*([kmbt])?\s*(?:speed|spd)\b/i,
  ]);

  const dexterity = extractNumber([
    /(?:dexterity|dex)[:\s]+([\d.]+)\s*([kmbt])?/i,
    /([\d.]+)\s*([kmbt])?\s*(?:dexterity|dex)\b/i,
  ]);

  let total = extractNumber([
    /(?:total|total\s+stats|bs)[:\s]+([\d.]+)\s*([kmbt])?/i,
    /([\d.]+)\s*([kmbt])?\s*(?:total|bs)\b/i,
  ]);

  // If total is missing but all 4 stats exist, sum them up
  if (!total && (strength || defense || speed || dexterity)) {
    total = (strength || 0) + (defense || 0) + (speed || 0) + (dexterity || 0);
  }

  // If only a single naked number is provided (e.g. user just types "150M")
  if (!total && !strength && !defense && !speed && !dexterity) {
    const standaloneMatch = clean.match(/^([\d.]+)\s*([kmbt])?$/i);
    if (standaloneMatch) {
      let val = parseFloat(standaloneMatch[1]);
      const unit = standaloneMatch[2]?.toLowerCase();
      if (unit === "k") val *= 1_000;
      else if (unit === "m") val *= 1_000_000;
      else if (unit === "b") val *= 1_000_000_000;
      else if (unit === "t") val *= 1_000_000_000_000;
      total = Math.round(val);
    }
  }

  if (!total && !strength && !defense && !speed && !dexterity) {
    return null;
  }

  return {
    playerId,
    name,
    strength,
    defense,
    speed,
    dexterity,
    total,
    timestamp: Math.floor(Date.now() / 1000),
    source: "MANUAL",
  };
}

/**
 * Computes comparative matchup between viewer and target.
 */
export function getMatchupRating(
  viewerLevel: number,
  targetLevel: number,
  targetEstMin: number,
  targetEstMax: number,
  targetKnownTotal?: number
): {
  rating: "EASY" | "FAIR" | "HARD" | "TITAN";
  label: string;
  color: string;
} {
  // If exact spy is known
  if (targetKnownTotal) {
    if (targetKnownTotal > 2_000_000_000) {
      return { rating: "TITAN", label: "TITAN (CALL ASSIST)", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
    }
    // Estimate viewer rough midpoint based on level
    const viewerMid = viewerLevel <= 20 ? 1_000_000 : viewerLevel <= 40 ? 15_000_000 : viewerLevel <= 60 ? 80_000_000 : 350_000_000;
    if (targetKnownTotal <= viewerMid * 0.7) {
      return { rating: "EASY", label: "HIGH WIN RATE", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    }
    if (targetKnownTotal <= viewerMid * 1.4) {
      return { rating: "FAIR", label: "FAIR FIGHT", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    }
    return { rating: "HARD", label: "HIGH THREAT", color: "text-red-400 bg-red-500/10 border-red-500/20" };
  }

  // Level-based comparative assessment
  const diff = targetLevel - viewerLevel;
  if (diff <= -10) {
    return { rating: "EASY", label: "EASY TARGET", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  }
  if (diff <= 8) {
    return { rating: "FAIR", label: "CONTESTED", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  }
  if (targetLevel >= 75) {
    return { rating: "TITAN", label: "TITAN (DANGER)", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
  }
  return { rating: "HARD", label: "HIGH THREAT", color: "text-red-400 bg-red-500/10 border-red-500/20" };
}

/**
 * Fair Fight (FF) Reverse-Engineering Solver (FFScouter Algorithm)
 * 
 * Reconstructs a defender's Total Battle Stats (TBS) from Torn attack logs
 * using the Fair Fight multiplier and known attacker battle stats.
 */

export interface FairFightEstimate {
  defenderId: number;
  fairFight: number;
  attackerTBS: number;
  minTBS: number;
  maxTBS: number;
  estimatedTBS: number;
  confidence: "EXACT" | "TIGHT" | "BOUNDED" | "FLOOR_ONLY" | "CEILING_ONLY";
  notes?: string;
}

export interface MultiHitStatEstimate {
  defenderId: number;
  hitsCount: number;
  minTBS: number;
  maxTBS: number;
  pointEstimate: number;
  confidencePercentage: number;
  isStatCapped: boolean; // true if capped at FF 1.00 or 3.00 bounds
}

// Torn Fair Fight ratio constant: FF = 1 + (Defender / Attacker) * (8 / 9)
// Therefore (Defender / Attacker) = (FF - 1) * (9 / 8) = (FF - 1) * 1.125
export const CANONICAL_FF_RATIO = 1.125; // 9 / 8
export const FF_RATIO_FACTOR = CANONICAL_FF_RATIO;

/**
 * Calculates Torn Fair Fight modifier from known attacker and defender total battle stats.
 * Formula: FF = 1 + (Defender / Attacker) * (8 / 9), clamped between 1.00 and 3.00.
 */
export function calculateFairFight(attackerTBS: number, defenderTBS: number): number {
  if (attackerTBS <= 0) {
    throw new Error("Attacker battle stats must be greater than 0");
  }
  const rawFF = 1 + (defenderTBS / attackerTBS) * (8 / 9);
  return Number(Math.min(3.00, Math.max(1.00, rawFF)).toFixed(2));
}

/**
 * Calculates estimated Defender Total Battle Stats from a single attack log entry.
 * 
 * @param attackerTBS Attacker's known total battle stats at the time of the attack.
 * @param fairFight Torn combat log Fair Fight modifier (between 1.00 and 3.00).
 * @param defenderId Optional Torn ID of defender.
 */
export function solveDefenderStatsFromFF(
  attackerTBS: number,
  fairFight: number,
  defenderId: number = 0
): FairFightEstimate {
  if (attackerTBS <= 0) {
    throw new Error("Attacker battle stats must be greater than 0");
  }

  // Clamped at 1.00: Defender stats are significantly lower than attacker (<= ~20% of attacker)
  if (fairFight <= 1.00) {
    const maxCeiling = Math.round(attackerTBS * 0.22);
    return {
      defenderId,
      fairFight: 1.00,
      attackerTBS,
      minTBS: 10,
      maxTBS: maxCeiling,
      estimatedTBS: Math.round(maxCeiling * 0.5),
      confidence: "CEILING_ONLY",
      notes: "Fair Fight at floor (1.00x). Defender stats are at most 22% of attacker.",
    };
  }

  // Clamped at 3.00: Defender stats are significantly higher than attacker (>= ~225% of attacker)
  if (fairFight >= 3.00) {
    const minFloor = Math.round(attackerTBS * 2.25);
    return {
      defenderId,
      fairFight: 3.00,
      attackerTBS,
      minTBS: minFloor,
      maxTBS: minFloor * 10, // Unbounded upper
      estimatedTBS: minFloor,
      confidence: "FLOOR_ONLY",
      notes: "Fair Fight at ceiling (3.00x). Defender stats are at least 225% of attacker.",
    };
  }

  // Linear region: 1.00 < FF < 3.00
  // Torn rounds FF to 2 decimal places, meaning true FF is within [FF - 0.005, FF + 0.005)
  const ffLow = Math.max(1.00, fairFight - 0.005);
  const ffHigh = Math.min(3.00, fairFight + 0.005);

  const minTBS = Math.round(attackerTBS * (ffLow - 1.0) * FF_RATIO_FACTOR);
  const maxTBS = Math.round(attackerTBS * (ffHigh - 1.0) * FF_RATIO_FACTOR);
  const estimatedTBS = Math.round(attackerTBS * (fairFight - 1.0) * FF_RATIO_FACTOR);

  return {
    defenderId,
    fairFight,
    attackerTBS,
    minTBS: Math.max(10, minTBS),
    maxTBS,
    estimatedTBS,
    confidence: "TIGHT",
    notes: `Derived with tight ±0.005 margin of error from ${fairFight.toFixed(2)}x Fair Fight modifier.`,
  };
}

/**
 * Combines multiple attack logs against the same defender from different attackers
 * to calculate the intersection and narrow down the confidence window.
 */
export function combineMultiHitEstimates(
  estimates: Array<{ attackerTBS: number; fairFight: number; defenderId?: number }>
): MultiHitStatEstimate | null {
  if (!estimates || estimates.length === 0) return null;

  let currentMin = 10;
  let currentMax = Number.MAX_SAFE_INTEGER;
  let hasValidLinearHit = false;
  let totalWeightedEstimate = 0;
  let totalWeight = 0;
  const defenderId = estimates[0].defenderId || 0;

  for (const hit of estimates) {
    const solved = solveDefenderStatsFromFF(hit.attackerTBS, hit.fairFight, defenderId);

    if (solved.confidence === "TIGHT") {
      hasValidLinearHit = true;
      currentMin = Math.max(currentMin, solved.minTBS);
      currentMax = Math.min(currentMax, solved.maxTBS);
      // Weight linear hits heavily
      totalWeightedEstimate += solved.estimatedTBS * 2;
      totalWeight += 2;
    } else if (solved.confidence === "CEILING_ONLY") {
      currentMax = Math.min(currentMax, solved.maxTBS);
      totalWeightedEstimate += solved.estimatedTBS;
      totalWeight += 1;
    } else if (solved.confidence === "FLOOR_ONLY") {
      currentMin = Math.max(currentMin, solved.minTBS);
      totalWeightedEstimate += solved.estimatedTBS;
      totalWeight += 1;
    }
  }

  // Ensure currentMin <= currentMax (in case of stat updates or training in between)
  if (currentMin > currentMax) {
    // If ranges conflict, take the average of the most recent bounds
    const fallback = Math.round((currentMin + currentMax) / 2);
    currentMin = Math.round(fallback * 0.85);
    currentMax = Math.round(fallback * 1.15);
  }

  const pointEstimate = totalWeight > 0 ? Math.round(totalWeightedEstimate / totalWeight) : currentMin;

  // Calculate confidence percentage: 100% when range is under 5% spread
  const spread = currentMax > 0 && currentMax !== Number.MAX_SAFE_INTEGER
    ? (currentMax - currentMin) / currentMax
    : 1;
  const confidencePercentage = Math.min(
    99,
    Math.max(40, Math.round((1 - Math.min(spread, 0.6) / 0.6) * 100))
  );

  return {
    defenderId,
    hitsCount: estimates.length,
    minTBS: currentMin,
    maxTBS: currentMax === Number.MAX_SAFE_INTEGER ? pointEstimate * 2 : currentMax,
    pointEstimate,
    confidencePercentage,
    isStatCapped: !hasValidLinearHit,
  };
}

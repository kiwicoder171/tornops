import {
  AttackRecord,
  MemberPayoutResult,
  PayoutFormulaWeights,
  WarPayoutCalculation,
} from "./types.js";

export const DEFAULT_PAYOUT_WEIGHTS: PayoutFormulaWeights = {
  basePayPerHit: 100000,       // $100,000 base per hit
  respectWeight: 50000,        // $50,000 per 1.0 respect
  assistPay: 50000,            // $50,000 per assist
  clutchSaveBonus: 500000,     // $500,000 bonus per clutch chain save (<30s)
  lossPenalty: 200000,         // -$200,000 penalty for losing an attack
  fairFightMultiplier: 1.0,    // 1.0 multiplier
};

interface MemberAggregate {
  playerId: number;
  playerName: string;
  hits: number;
  assists: number;
  losses: number;
  clutchSaves: number;
  totalRespect: number;
}

/**
 * Calculates fair-share war payout breakdown for all participating faction members.
 */
export function calculateWarPayout(
  warId: number,
  totalCashPool: number,
  attacks: AttackRecord[],
  factionId: number,
  customWeights: Partial<PayoutFormulaWeights> = {}
): WarPayoutCalculation {
  const weights: PayoutFormulaWeights = { ...DEFAULT_PAYOUT_WEIGHTS, ...customWeights };
  const memberMap = new Map<number, MemberAggregate>();

  let totalHits = 0;
  let totalRespect = 0;
  let totalAssists = 0;

  // Aggregate attacks made by our faction members
  for (const attack of attacks) {
    if (attack.attackerFactionId !== factionId) continue;

    let member = memberMap.get(attack.attackerId);
    if (!member) {
      member = {
        playerId: attack.attackerId,
        playerName: attack.attackerName || `Player #${attack.attackerId}`,
        hits: 0,
        assists: 0,
        losses: 0,
        clutchSaves: 0,
        totalRespect: 0,
      };
      memberMap.set(attack.attackerId, member);
    }

    if (attack.result === "Attacked" || attack.result === "Mugged" || attack.result === "Hospitalized") {
      member.hits += 1;
      member.totalRespect += attack.respectGain || 0;
      totalHits += 1;
      totalRespect += attack.respectGain || 0;

      if (attack.isClutchSave) {
        member.clutchSaves += 1;
      }
    } else if (attack.result === "Assist") {
      member.assists += 1;
      totalAssists += 1;
    } else if (attack.result === "Lost") {
      member.losses += 1;
    }
  }

  // Calculate raw scores based on weights
  const scoredMembers: Array<MemberAggregate & { rawScore: number }> = [];
  let totalRawScore = 0;

  for (const member of memberMap.values()) {
    const rawScore = Math.max(
      0,
      member.hits * weights.basePayPerHit +
        member.totalRespect * weights.respectWeight +
        member.assists * weights.assistPay +
        member.clutchSaves * weights.clutchSaveBonus -
        member.losses * weights.lossPenalty
    );

    scoredMembers.push({ ...member, rawScore });
    totalRawScore += rawScore;
  }

  // Allocate pool proportionally
  const memberPayouts: MemberPayoutResult[] = scoredMembers.map((m) => {
    const percentageOfPool = totalRawScore > 0 ? m.rawScore / totalRawScore : 0;
    const finalPayout = Math.floor(totalCashPool * percentageOfPool);

    return {
      playerId: m.playerId,
      playerName: m.playerName,
      hits: m.hits,
      assists: m.assists,
      losses: m.losses,
      clutchSaves: m.clutchSaves,
      totalRespect: Number(m.totalRespect.toFixed(2)),
      rawScore: Math.round(m.rawScore),
      percentageOfPool: Number((percentageOfPool * 100).toFixed(2)),
      finalPayout,
    };
  });

  // Sort descending by final payout
  memberPayouts.sort((a, b) => b.finalPayout - a.finalPayout);

  return {
    warId,
    totalCashPool,
    weights,
    totalHits,
    totalRespect: Number(totalRespect.toFixed(2)),
    totalAssists,
    memberPayouts,
  };
}

/**
 * Formats the payout result into standard JSON payload for Torn Payout Userscripts.
 * Format: { [playerId]: amount }
 */
export function exportPayoutToJson(payouts: MemberPayoutResult[]): string {
  const payload: Record<string, number> = {};
  for (const item of payouts) {
    if (item.finalPayout > 0) {
      payload[item.playerId.toString()] = item.finalPayout;
    }
  }
  return JSON.stringify(payload, null, 2);
}

/**
 * Formats the payout results into CSV format for spreadsheets.
 */
export function exportPayoutToCsv(payouts: MemberPayoutResult[]): string {
  const headers = [
    "Player ID",
    "Player Name",
    "Hits",
    "Assists",
    "Losses",
    "Clutch Saves",
    "Total Respect",
    "Pool Share (%)",
    "Final Payout ($)",
  ];

  const rows = payouts.map((p) => [
    p.playerId,
    `"${p.playerName.replace(/"/g, '""')}"`,
    p.hits,
    p.assists,
    p.losses,
    p.clutchSaves,
    p.totalRespect,
    p.percentageOfPool,
    p.finalPayout,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

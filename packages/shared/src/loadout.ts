/**
 * KAL Loadout & Target Intel Core (@torn/shared)
 * 
 * Models defender armor sets, hit-location damage mitigation mathematics,
 * set completeness & missing slot vulnerabilities, and Ranked War weapon bonuses.
 */

// --- Armor Slot Definitions ---
export type ArmorSlot = "HELMET" | "CHEST" | "PANTS" | "GLOVES" | "BOOTS";

export const ARMOR_SLOTS: readonly ArmorSlot[] = [
  "HELMET",
  "CHEST",
  "PANTS",
  "GLOVES",
  "BOOTS",
] as const;

/**
 * Standard Torn combat hit-location multipliers / weights.
 * Total sum equals 1.00 (100% of body hits).
 */
export const ARMOR_SLOT_WEIGHTS: Record<ArmorSlot, number> = {
  HELMET: 0.15, // Head: 15% combat hit weight, critical damage multiplier
  CHEST: 0.40,  // Chest & stomach: 40% combat hit weight
  PANTS: 0.25,  // Legs & groin: 25% combat hit weight
  GLOVES: 0.10, // Arms & hands: 10% combat hit weight
  BOOTS: 0.10,  // Feet: 10% combat hit weight
};

// --- Canonical Armor Sets ---
export interface ArmorSetDefinition {
  id: string;
  name: string;
  tier: "CIVILIAN" | "TACTICAL" | "MILITARY" | "HEAVY" | "BALLISTIC" | "WAR_CACHE";
  basePieceArmor: number;
  maxQualityArmor: number;
  fullSetAvgRating: number;
  slotArmor: Record<ArmorSlot, number>;
  description: string;
}

export const CANONICAL_ARMOR_SETS: Record<string, ArmorSetDefinition> = {
  Leather: {
    id: "leather",
    name: "Leather",
    tier: "CIVILIAN",
    basePieceArmor: 18.0,
    maxQualityArmor: 22.0,
    fullSetAvgRating: 20.0,
    slotArmor: { HELMET: 18.0, CHEST: 21.0, PANTS: 19.5, GLOVES: 17.5, BOOTS: 18.0 },
    description: "Civilian / entry-level leather protection.",
  },
  Kevlar: {
    id: "kevlar",
    name: "Kevlar",
    tier: "CIVILIAN",
    basePieceArmor: 26.0,
    maxQualityArmor: 32.0,
    fullSetAvgRating: 29.5,
    slotArmor: { HELMET: 28.0, CHEST: 31.0, PANTS: 29.0, GLOVES: 26.0, BOOTS: 26.5 },
    description: "Basic police and private security standard ballistic armor.",
  },
  Combat: {
    id: "combat",
    name: "Combat",
    tier: "MILITARY",
    basePieceArmor: 35.0,
    maxQualityArmor: 42.0,
    fullSetAvgRating: 38.5,
    slotArmor: { HELMET: 38.0, CHEST: 40.5, PANTS: 38.0, GLOVES: 35.0, BOOTS: 35.5 },
    description: "Standard military issue combat armor.",
  },
  Assault: {
    id: "assault",
    name: "Assault",
    tier: "MILITARY",
    basePieceArmor: 41.0,
    maxQualityArmor: 48.0,
    fullSetAvgRating: 44.5,
    slotArmor: { HELMET: 44.0, CHEST: 46.5, PANTS: 44.0, GLOVES: 41.0, BOOTS: 41.5 },
    description: "Heavy tactical assault armor with reinforced plating.",
  },
  Riot: {
    id: "riot",
    name: "Riot",
    tier: "TACTICAL",
    basePieceArmor: 45.0,
    maxQualityArmor: 52.0,
    fullSetAvgRating: 48.5,
    slotArmor: { HELMET: 48.0, CHEST: 50.5, PANTS: 48.0, GLOVES: 45.0, BOOTS: 45.5 },
    description: "Anti-riot protective spec optimized against blunt force and ballistic impacts.",
  },
  Dune: {
    id: "dune",
    name: "Dune",
    tier: "TACTICAL",
    basePieceArmor: 47.0,
    maxQualityArmor: 54.0,
    fullSetAvgRating: 50.5,
    slotArmor: { HELMET: 50.0, CHEST: 52.5, PANTS: 50.0, GLOVES: 47.0, BOOTS: 47.5 },
    description: "Environmental tactical desert armor with lightweight ceramic composites.",
  },
  Delta: {
    id: "delta",
    name: "Delta",
    tier: "MILITARY",
    basePieceArmor: 49.0,
    maxQualityArmor: 56.0,
    fullSetAvgRating: 52.5,
    slotArmor: { HELMET: 52.0, CHEST: 54.5, PANTS: 52.0, GLOVES: 49.0, BOOTS: 49.5 },
    description: "Special operations tier combat armor with advanced ballistic fibers.",
  },
  Marauder: {
    id: "marauder",
    name: "Marauder",
    tier: "HEAVY",
    basePieceArmor: 53.0,
    maxQualityArmor: 60.0,
    fullSetAvgRating: 56.5,
    slotArmor: { HELMET: 56.0, CHEST: 58.5, PANTS: 56.0, GLOVES: 53.0, BOOTS: 53.5 },
    description: "Elite heavy combat exosuit armor designed for prolonged brawls.",
  },
  EOD: {
    id: "eod",
    name: "EOD",
    tier: "BALLISTIC",
    basePieceArmor: 57.0,
    maxQualityArmor: 65.0,
    fullSetAvgRating: 62.0,
    slotArmor: { HELMET: 61.0, CHEST: 64.5, PANTS: 61.5, GLOVES: 57.0, BOOTS: 58.0 },
    description: "Explosive Ordnance Disposal peak ballistic protection suit.",
  },
  Sentinel: {
    id: "sentinel",
    name: "Sentinel",
    tier: "WAR_CACHE",
    basePieceArmor: 58.0,
    maxQualityArmor: 66.0,
    fullSetAvgRating: 63.5,
    slotArmor: { HELMET: 63.0, CHEST: 65.5, PANTS: 63.0, GLOVES: 58.5, BOOTS: 59.0 },
    description: "Ranked War Cache Tier 1 advanced tactical defensive system.",
  },
  Vanguard: {
    id: "vanguard",
    name: "Vanguard",
    tier: "WAR_CACHE",
    basePieceArmor: 60.0,
    maxQualityArmor: 68.0,
    fullSetAvgRating: 65.0,
    slotArmor: { HELMET: 64.5, CHEST: 67.0, PANTS: 64.5, GLOVES: 60.5, BOOTS: 61.0 },
    description: "Ranked War Cache Tier 2 supreme defensive armor with ultra-dense alloy weave.",
  },
};

// --- Armor Piece & Loadout Interfaces ---
export interface ArmorPiece {
  slot: ArmorSlot;
  name: string;
  setName?: string;
  armorRating: number; // 0.0 to 100.0
  quality?: number;     // 0% to 100%
}

export interface DefenderLoadout {
  armorPieces: Partial<Record<ArmorSlot, ArmorPiece>>;
  setName?: string;
  weapons?: DefenderWeapon[];
}

export interface SlotMitigationDetail {
  armorRating: number;
  mitigationPercentage: number;
  damageMultiplier: number;
  weight: number;
  weightedMitigation: number;
}

export interface MissingSlotVulnerability {
  slot: ArmorSlot;
  hitChancePercentage: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
}

export interface EffectiveMitigationResult {
  effectiveArmor: number;
  effectiveMitigationPercentage: number;
  damageMultiplier: number;
  completenessPercentage: number;
  equippedSlotsCount: number;
  isCompleteSet: boolean;
  identifiedSet: string | null;
  missingSlots: ArmorSlot[];
  vulnerabilities: MissingSlotVulnerability[];
  slotBreakdown: Record<ArmorSlot, SlotMitigationDetail>;
}

// --- Ranked War Weapon Bonus Interfaces ---
export type RankedWarBonusType =
  | "Execute"
  | "Plunder"
  | "Bloodlust"
  | "Paralyze"
  | "Powerful"
  | "Specialist"
  | "Expose"
  | "Wither"
  | "Disarm"
  | "Revitalize";

export interface WeaponBonus {
  type: RankedWarBonusType;
  value: number; // e.g. 24 for 24%
  description?: string;
}

export interface DefenderWeapon {
  name: string;
  category?: "PRIMARY" | "SECONDARY" | "MELEE";
  bonuses: WeaponBonus[];
}

export interface WeaponThreatAssessment {
  threatLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "STANDARD";
  hasExecute: boolean;
  executeThreshold: number | null;
  hasBloodlust: boolean;
  bloodlustPercent: number | null;
  hasParalyze: boolean;
  paralyzePercent: number | null;
  hasPlunder: boolean;
  plunderPercent: number | null;
  alertBadges: string[];
  tacticalWarnings: string[];
  summary: string;
}

export interface ArmorStrengthAssessment {
  tier: "UNARMORED" | "LIGHT" | "MEDIUM" | "HEAVY" | "FORTIFIED" | "JUGGERNAUT";
  badge: string;
  vulnerabilityWarning: string | null;
}

// --- Loadout Mitigation Calculation Engine ---

/**
 * Calculates weighted damage mitigation, set completeness, and missing slot vulnerabilities.
 * 
 * Formula:
 * - When hit in slot s, damage received is Raw Damage * (1 - (Armor_s / 100)).
 * - Mitigation_s = Armor_s / 100.
 * - Overall Effective Armor = sum(Armor_s * Weight_s).
 * - Overall Effective Mitigation = sum(Mitigation_s * Weight_s) = Effective Armor / 100.
 * - Overall Damage Multiplier = 1 - Effective Mitigation.
 */
export function calculateEffectiveMitigation(loadout: DefenderLoadout): EffectiveMitigationResult {
  let totalEffectiveArmor = 0;
  let equippedCount = 0;
  const missingSlots: ArmorSlot[] = [];
  const vulnerabilities: MissingSlotVulnerability[] = [];

  const slotBreakdown = {} as Record<ArmorSlot, SlotMitigationDetail>;

  for (const slot of ARMOR_SLOTS) {
    const piece = loadout.armorPieces?.[slot];
    const weight = ARMOR_SLOT_WEIGHTS[slot];

    if (piece && piece.armorRating > 0) {
      equippedCount++;
      const clampedArmor = Math.min(100, Math.max(0, piece.armorRating));
      const mitigationPct = clampedArmor; // in percent
      const damageMultiplier = 1 - clampedArmor / 100;
      const weightedMitigation = (clampedArmor / 100) * weight;
      totalEffectiveArmor += clampedArmor * weight;

      slotBreakdown[slot] = {
        armorRating: Number(clampedArmor.toFixed(1)),
        mitigationPercentage: Number(mitigationPct.toFixed(1)),
        damageMultiplier: Number(damageMultiplier.toFixed(3)),
        weight,
        weightedMitigation: Number(weightedMitigation.toFixed(4)),
      };
    } else {
      missingSlots.push(slot);
      slotBreakdown[slot] = {
        armorRating: 0,
        mitigationPercentage: 0,
        damageMultiplier: 1.0,
        weight,
        weightedMitigation: 0,
      };

      // Identify vulnerability severity
      let severity: MissingSlotVulnerability["severity"] = "LOW";
      let desc = "";

      if (slot === "HELMET") {
        severity = "CRITICAL";
        desc = "No Helmet: 15% hit chance suffers 100% unmitigated critical headshot damage.";
      } else if (slot === "CHEST") {
        severity = "HIGH";
        desc = "No Body Armor: 40% hit chance suffers completely unmitigated torso damage.";
      } else if (slot === "PANTS") {
        severity = "MEDIUM";
        desc = "No Pants: 25% hit chance suffers unmitigated leg/groin damage.";
      } else if (slot === "GLOVES") {
        severity = "LOW";
        desc = "No Gloves: 10% hit chance has 0% hand/arm mitigation.";
      } else if (slot === "BOOTS") {
        severity = "LOW";
        desc = "No Boots: 10% hit chance has 0% foot mitigation.";
      }

      vulnerabilities.push({
        slot,
        hitChancePercentage: Math.round(weight * 100),
        severity,
        description: desc,
      });
    }
  }

  const effectiveMitigationPct = totalEffectiveArmor; // Since sum(weights) = 1.0
  const damageMultiplier = Math.max(0, 1 - effectiveMitigationPct / 100);
  const completenessPercentage = (equippedCount / ARMOR_SLOTS.length) * 100;
  const isCompleteSet = equippedCount === ARMOR_SLOTS.length;

  return {
    effectiveArmor: Number(totalEffectiveArmor.toFixed(1)),
    effectiveMitigationPercentage: Number(effectiveMitigationPct.toFixed(1)),
    damageMultiplier: Number(damageMultiplier.toFixed(3)),
    completenessPercentage,
    equippedSlotsCount: equippedCount,
    isCompleteSet,
    identifiedSet: loadout.setName || null,
    missingSlots,
    vulnerabilities,
    slotBreakdown,
  };
}

// --- Weapon Threat Evaluation Engine ---

/**
 * Analyzes defender weapons and bonuses to evaluate combat lethality and tactical warnings.
 */
export function evaluateWeaponThreats(
  weaponsOrBonuses: DefenderWeapon[] | WeaponBonus[]
): WeaponThreatAssessment {
  const bonuses: WeaponBonus[] = [];

  if (Array.isArray(weaponsOrBonuses)) {
    for (const item of weaponsOrBonuses) {
      if ("bonuses" in item && Array.isArray((item as DefenderWeapon).bonuses)) {
        bonuses.push(...(item as DefenderWeapon).bonuses);
      } else if ("type" in item && "value" in item) {
        bonuses.push(item as WeaponBonus);
      }
    }
  }

  let hasExecute = false;
  let executeThreshold: number | null = null;
  let hasBloodlust = false;
  let bloodlustPercent: number | null = null;
  let hasParalyze = false;
  let paralyzePercent: number | null = null;
  let hasPlunder = false;
  let plunderPercent: number | null = null;

  const alertBadges: string[] = [];
  const tacticalWarnings: string[] = [];

  for (const b of bonuses) {
    if (b.type === "Execute") {
      hasExecute = true;
      executeThreshold = Math.max(executeThreshold || 0, b.value);
      alertBadges.push(`⚔️ Execute ${b.value}%`);
      tacticalWarnings.push(
        `DANGER: Execute trigger at ≤${b.value}% HP! Friendly attackers must avoid soloing at low health.`
      );
    } else if (b.type === "Bloodlust") {
      hasBloodlust = true;
      bloodlustPercent = Math.max(bloodlustPercent || 0, b.value);
      alertBadges.push(`🩸 Bloodlust ${b.value}%`);
      tacticalWarnings.push(
        `SUSTAIN: Target heals for ${b.value}% of damage dealt. High endurance threat.`
      );
    } else if (b.type === "Paralyze") {
      hasParalyze = true;
      paralyzePercent = Math.max(paralyzePercent || 0, b.value);
      alertBadges.push(`⚡ Paralyze ${b.value}%`);
      tacticalWarnings.push(
        `STUN: ${b.value}% turn-denial proc chance. Severe action speed suppression.`
      );
    } else if (b.type === "Plunder") {
      hasPlunder = true;
      plunderPercent = Math.max(plunderPercent || 0, b.value);
      alertBadges.push(`💰 Plunder +${b.value}%`);
      tacticalWarnings.push(`MUG THREAT: +${b.value}% cash bonus if target mugs.`);
    } else if (b.type === "Powerful") {
      alertBadges.push(`💥 Powerful +${b.value}%`);
    } else if (b.type === "Specialist") {
      alertBadges.push(`🎯 Specialist +${b.value}%`);
    } else if (b.type === "Expose") {
      alertBadges.push(`🔓 Expose -${b.value}% Def`);
    } else if (b.type === "Wither") {
      alertBadges.push(`🥀 Wither -${b.value}% Str`);
    }
  }

  let threatLevel: WeaponThreatAssessment["threatLevel"] = "STANDARD";
  if (hasExecute && (executeThreshold || 0) >= 20) {
    threatLevel = "CRITICAL";
  } else if (hasExecute || (hasBloodlust && (bloodlustPercent || 0) >= 20) || hasParalyze) {
    threatLevel = "HIGH";
  } else if (bonuses.length > 0) {
    threatLevel = "MEDIUM";
  }

  const summary =
    alertBadges.length > 0
      ? alertBadges.join(" | ")
      : "Standard Equipment (No RW Bonuses)";

  return {
    threatLevel,
    hasExecute,
    executeThreshold,
    hasBloodlust,
    bloodlustPercent,
    hasParalyze,
    paralyzePercent,
    hasPlunder,
    plunderPercent,
    alertBadges,
    tacticalWarnings,
    summary,
  };
}

// --- Armor Strength Assessment ---

/**
 * Classifies defensive resilience based on effective mitigation percentage and vulnerabilities.
 */
export function evaluateArmorStrengths(
  mitigation: EffectiveMitigationResult
): ArmorStrengthAssessment {
  const mit = mitigation.effectiveMitigationPercentage;
  let tier: ArmorStrengthAssessment["tier"] = "UNARMORED";

  if (mit >= 60.0) {
    tier = "JUGGERNAUT";
  } else if (mit >= 50.0) {
    tier = "FORTIFIED";
  } else if (mit >= 40.0) {
    tier = "HEAVY";
  } else if (mit >= 25.0) {
    tier = "MEDIUM";
  } else if (mit >= 10.0) {
    tier = "LIGHT";
  } else {
    tier = "UNARMORED";
  }

  const setName = mitigation.identifiedSet || "Custom";
  const badge = mit > 0
    ? `${setName} (${mit.toFixed(0)}% Mit)`
    : "Unarmored (0% Mit)";

  let vulnerabilityWarning: string | null = null;
  const criticalVuln = mitigation.vulnerabilities.find((v) => v.severity === "CRITICAL");
  const highVuln = mitigation.vulnerabilities.find((v) => v.severity === "HIGH");

  if (criticalVuln) {
    vulnerabilityWarning = `⚠️ CRITICAL: Missing Helmet! 100% headshot vulnerability.`;
  } else if (highVuln) {
    vulnerabilityWarning = `⚠️ WARNING: Missing Chest Armor! 40% hit exposure.`;
  } else if (mitigation.missingSlots.length > 0) {
    vulnerabilityWarning = `Missing ${mitigation.missingSlots.length} slot(s): ${mitigation.missingSlots.join(", ")}`;
  }

  return {
    tier,
    badge,
    vulnerabilityWarning,
  };
}

// --- Factory & Formatting Helpers ---

/**
 * Creates a synthetic full 5-piece DefenderLoadout for a canonical armor set.
 * Quality scales from 0 (basePieceArmor) to 100 (maxQualityArmor).
 */
export function createLoadoutFromSet(
  setName: string,
  quality: number = 100,
  weapons: DefenderWeapon[] = []
): DefenderLoadout {
  const def = CANONICAL_ARMOR_SETS[setName];
  if (!def) {
    throw new Error(`Unknown canonical armor set: ${setName}`);
  }

  const q = Math.min(100, Math.max(0, quality)) / 100;
  const armorPieces: Partial<Record<ArmorSlot, ArmorPiece>> = {};

  for (const slot of ARMOR_SLOTS) {
    const baseVal = def.slotArmor[slot];
    const maxVal = def.maxQualityArmor;
    const rating = baseVal + (maxVal - baseVal) * q;
    armorPieces[slot] = {
      slot,
      name: `${def.name} ${slot.charAt(0) + slot.slice(1).toLowerCase()}`,
      setName: def.name,
      armorRating: Number(rating.toFixed(1)),
      quality,
    };
  }

  return {
    setName: def.name,
    armorPieces,
    weapons,
  };
}

/**
 * Formats a clean armor set chip string.
 * Example: "🛡️ Riot Set (~48% Mit)" or "🛡️ Unarmored"
 */
export function formatArmorChip(loadoutOrName?: DefenderLoadout | string | null): string {
  if (!loadoutOrName) return "🛡️ Unarmored";

  if (typeof loadoutOrName === "string") {
    const trimmed = loadoutOrName.trim();
    if (!trimmed || trimmed === "None" || trimmed === "Unarmored") return "🛡️ Unarmored";
    const canonical = CANONICAL_ARMOR_SETS[trimmed];
    if (canonical) {
      return `🛡️ ${canonical.name} Set (~${canonical.fullSetAvgRating.toFixed(0)}% Mit)`;
    }
    return `🛡️ ${trimmed}`;
  }

  const mitigation = calculateEffectiveMitigation(loadoutOrName);
  const setName = loadoutOrName.setName || (mitigation.effectiveMitigationPercentage > 0 ? "Custom" : "Unarmored");
  if (mitigation.effectiveMitigationPercentage <= 0) return "🛡️ Unarmored";
  return `🛡️ ${setName} (~${mitigation.effectiveMitigationPercentage.toFixed(0)}% Mit)`;
}

/**
 * Formats weapon bonus summary tags.
 * Example: ["⚔️ Execute 24%", "🩸 Bloodlust 20%"]
 */
export function formatWeaponBonusChips(
  weaponsOrBonuses?: DefenderWeapon[] | WeaponBonus[] | string | null
): string[] {
  if (!weaponsOrBonuses) return [];

  if (typeof weaponsOrBonuses === "string") {
    const trimmed = weaponsOrBonuses.trim();
    if (!trimmed || trimmed === "None") return [];
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const assessment = evaluateWeaponThreats(weaponsOrBonuses);
  return assessment.alertBadges;
}

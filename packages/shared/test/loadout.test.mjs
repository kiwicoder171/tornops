import test from "node:test";
import assert from "node:assert/strict";
import {
  ARMOR_SLOTS,
  ARMOR_SLOT_WEIGHTS,
  CANONICAL_ARMOR_SETS,
  calculateEffectiveMitigation,
  evaluateWeaponThreats,
  evaluateArmorStrengths,
  createLoadoutFromSet,
  formatArmorChip,
  formatWeaponBonusChips,
} from "../dist/loadout.js";

test("Armor Slots and Hit-Location Weights match Torn mechanics", () => {
  assert.equal(ARMOR_SLOTS.length, 5);
  assert.deepEqual([...ARMOR_SLOTS], ["HELMET", "CHEST", "PANTS", "GLOVES", "BOOTS"]);

  assert.equal(ARMOR_SLOT_WEIGHTS.HELMET, 0.15); // Head: 15%
  assert.equal(ARMOR_SLOT_WEIGHTS.CHEST, 0.40);  // Chest: 40%
  assert.equal(ARMOR_SLOT_WEIGHTS.PANTS, 0.25);  // Legs: 25%
  assert.equal(ARMOR_SLOT_WEIGHTS.GLOVES, 0.10); // Arms/Hands: 10%
  assert.equal(ARMOR_SLOT_WEIGHTS.BOOTS, 0.10);  // Feet: 10%

  const totalWeight = Object.values(ARMOR_SLOT_WEIGHTS).reduce((sum, w) => sum + w, 0);
  assert.equal(Math.round(totalWeight * 100) / 100, 1.00);
});

test("Canonical Armor Sets catalog contains all required tiers", () => {
  const expectedSets = [
    "Leather",
    "Kevlar",
    "Combat",
    "Assault",
    "Riot",
    "Dune",
    "Delta",
    "Marauder",
    "EOD",
    "Sentinel",
    "Vanguard",
  ];

  for (const setName of expectedSets) {
    const setDef = CANONICAL_ARMOR_SETS[setName];
    assert.ok(setDef, `Canonical armor set ${setName} must exist`);
    assert.equal(setDef.name, setName);
    assert.ok(setDef.basePieceArmor > 0);
    assert.ok(setDef.maxQualityArmor >= setDef.basePieceArmor);
    assert.ok(setDef.fullSetAvgRating > 0);
    for (const slot of ARMOR_SLOTS) {
      assert.ok(setDef.slotArmor[slot] > 0, `Slot ${slot} must have armor rating in ${setName}`);
    }
  }

  // Verify progression: Leather < Combat < Riot < EOD < Vanguard
  assert.ok(CANONICAL_ARMOR_SETS.Leather.fullSetAvgRating < CANONICAL_ARMOR_SETS.Combat.fullSetAvgRating);
  assert.ok(CANONICAL_ARMOR_SETS.Combat.fullSetAvgRating < CANONICAL_ARMOR_SETS.Riot.fullSetAvgRating);
  assert.ok(CANONICAL_ARMOR_SETS.Riot.fullSetAvgRating < CANONICAL_ARMOR_SETS.EOD.fullSetAvgRating);
  assert.ok(CANONICAL_ARMOR_SETS.EOD.fullSetAvgRating <= CANONICAL_ARMOR_SETS.Vanguard.fullSetAvgRating);
});

test("calculateEffectiveMitigation calculates weighted mitigation and damage multiplier", () => {
  // Case 1: Full EOD Set at 100% quality (all pieces ~65 rating)
  const eodLoadout = createLoadoutFromSet("EOD", 100);
  const eodResult = calculateEffectiveMitigation(eodLoadout);

  assert.equal(eodResult.isCompleteSet, true);
  assert.equal(eodResult.equippedSlotsCount, 5);
  assert.equal(eodResult.completenessPercentage, 100);
  assert.equal(eodResult.missingSlots.length, 0);
  assert.equal(eodResult.vulnerabilities.length, 0);
  // Max quality EOD pieces are 65.0 rating -> effective armor = 65.0
  assert.equal(eodResult.effectiveArmor, 65.0);
  assert.equal(eodResult.effectiveMitigationPercentage, 65.0);
  assert.equal(eodResult.damageMultiplier, 0.35); // 1 - 0.65 = 0.35

  // Case 2: Riot Set at 0% quality (base piece ratings: Helmet 48, Chest 50.5, Pants 48, Gloves 45, Boots 45.5)
  // Expected: 48*0.15 + 50.5*0.4 + 48*0.25 + 45*0.1 + 45.5*0.1 = 7.2 + 20.2 + 12 + 4.5 + 4.55 = 48.45 -> 48.5
  const riotLoadout = createLoadoutFromSet("Riot", 0);
  const riotResult = calculateEffectiveMitigation(riotLoadout);
  assert.equal(riotResult.effectiveArmor, 48.5);
  assert.equal(riotResult.effectiveMitigationPercentage, 48.5);
  assert.equal(riotResult.damageMultiplier, 0.515);

  // Case 3: Completely Unarmored defender
  const unarmoredResult = calculateEffectiveMitigation({ armorPieces: {} });
  assert.equal(unarmoredResult.isCompleteSet, false);
  assert.equal(unarmoredResult.equippedSlotsCount, 0);
  assert.equal(unarmoredResult.effectiveArmor, 0);
  assert.equal(unarmoredResult.effectiveMitigationPercentage, 0);
  assert.equal(unarmoredResult.damageMultiplier, 1.0); // 100% full unmitigated damage
  assert.equal(unarmoredResult.missingSlots.length, 5);
  assert.equal(unarmoredResult.vulnerabilities.length, 5);
});

test("calculateEffectiveMitigation identifies missing slot vulnerabilities accurately", () => {
  // Defender wearing Combat armor on Chest, Pants, Gloves, Boots but NO HELMET
  const noHelmetLoadout = {
    setName: "Combat (No Helmet)",
    armorPieces: {
      CHEST: { slot: "CHEST", name: "Combat Vest", armorRating: 40 },
      PANTS: { slot: "PANTS", name: "Combat Pants", armorRating: 38 },
      GLOVES: { slot: "GLOVES", name: "Combat Gloves", armorRating: 35 },
      BOOTS: { slot: "BOOTS", name: "Combat Boots", armorRating: 35 },
    },
  };

  const result = calculateEffectiveMitigation(noHelmetLoadout);
  assert.equal(result.isCompleteSet, false);
  assert.equal(result.equippedSlotsCount, 4);
  assert.equal(result.missingSlots.length, 1);
  assert.equal(result.missingSlots[0], "HELMET");

  // Critical vulnerability on headshot
  const headVuln = result.vulnerabilities.find((v) => v.slot === "HELMET");
  assert.ok(headVuln);
  assert.equal(headVuln.severity, "CRITICAL");
  assert.equal(headVuln.hitChancePercentage, 15);
  assert.ok(headVuln.description.includes("No Helmet"));

  // Check slot breakdown
  assert.equal(result.slotBreakdown.HELMET.armorRating, 0);
  assert.equal(result.slotBreakdown.HELMET.damageMultiplier, 1.0);
  assert.equal(result.slotBreakdown.CHEST.damageMultiplier, 0.6); // 1 - 40/100
});

test("evaluateWeaponThreats classifies Ranked War weapon bonuses and warnings", () => {
  // Target armed with Execute and Paralyze
  const weapons = [
    {
      name: "Enfield SA-80 (Orange)",
      bonuses: [
        { type: "Execute", value: 24, description: "Finishes targets at 24% HP" },
        { type: "Paralyze", value: 15, description: "15% stun proc" },
      ],
    },
    {
      name: "Macana (Yellow)",
      bonuses: [
        { type: "Bloodlust", value: 20, description: "20% lifesteal" },
        { type: "Plunder", value: 35, description: "+35% mug cash" },
      ],
    },
  ];

  const assessment = evaluateWeaponThreats(weapons);
  assert.equal(assessment.threatLevel, "CRITICAL");
  assert.equal(assessment.hasExecute, true);
  assert.equal(assessment.executeThreshold, 24);
  assert.equal(assessment.hasBloodlust, true);
  assert.equal(assessment.bloodlustPercent, 20);
  assert.equal(assessment.hasParalyze, true);
  assert.equal(assessment.paralyzePercent, 15);
  assert.equal(assessment.hasPlunder, true);
  assert.equal(assessment.plunderPercent, 35);

  assert.ok(assessment.alertBadges.includes("⚔️ Execute 24%"));
  assert.ok(assessment.alertBadges.includes("🩸 Bloodlust 20%"));
  assert.ok(assessment.alertBadges.includes("⚡ Paralyze 15%"));
  assert.ok(assessment.alertBadges.includes("💰 Plunder +35%"));

  assert.ok(assessment.tacticalWarnings.some((w) => w.includes("Execute trigger at ≤24% HP")));
  assert.ok(assessment.tacticalWarnings.some((w) => w.includes("Target heals for 20%")));
  assert.ok(assessment.tacticalWarnings.some((w) => w.includes("15% turn-denial")));
});

test("evaluateArmorStrengths and chip formatters render clear tactical intel", () => {
  const eodLoadout = createLoadoutFromSet("EOD", 100);
  const mitigation = calculateEffectiveMitigation(eodLoadout);
  const strength = evaluateArmorStrengths(mitigation);

  assert.equal(strength.tier, "JUGGERNAUT");
  assert.equal(strength.badge, "EOD (65% Mit)");
  assert.equal(strength.vulnerabilityWarning, null);

  // Chip formatters
  assert.equal(formatArmorChip("Riot"), "🛡️ Riot Set (~49% Mit)");
  assert.equal(formatArmorChip("EOD"), "🛡️ EOD Set (~62% Mit)");
  assert.equal(formatArmorChip("None"), "🛡️ Unarmored");
  assert.equal(formatArmorChip(null), "🛡️ Unarmored");
  assert.equal(formatArmorChip(eodLoadout), "🛡️ EOD (~65% Mit)");

  const weaponBonusChips = formatWeaponBonusChips("Execute 25%, Bloodlust 18%");
  assert.deepEqual(weaponBonusChips, ["Execute 25%", "Bloodlust 18%"]);
});

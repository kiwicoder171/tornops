import test from "node:test";
import assert from "node:assert/strict";
import {
  solveDefenderStatsFromFF,
  combineMultiHitEstimates,
  calculateFairFight,
  CANONICAL_FF_RATIO,
  FF_RATIO_FACTOR,
} from "../dist/fair-fight.js";
import { reverseFairFight } from "../dist/stat-estimator.js";

test("Canonical Fair Fight ratio constant equals 9/8 = 1.125", () => {
  assert.equal(CANONICAL_FF_RATIO, 1.125);
  assert.equal(FF_RATIO_FACTOR, 1.125);
  assert.equal(9 / 8, 1.125);
});

test("calculateFairFight models canonical Torn combat formula", () => {
  // Attacker and Defender with equal stats (1,000,000 each)
  // FF = 1 + (1,000,000 / 1,000,000) * (8 / 9) = 1 + 0.8888... = 1.89
  const ffEqual = calculateFairFight(1_000_000, 1_000_000);
  assert.equal(ffEqual, 1.89);

  // Defender is 2x stronger: FF = 1 + 2 * (8 / 9) = 1 + 1.777... = 2.78
  const ffStronger = calculateFairFight(1_000_000, 2_000_000);
  assert.equal(ffStronger, 2.78);

  // Defender is much stronger (>2.25x): clamps at 3.00
  const ffMax = calculateFairFight(1_000_000, 5_000_000);
  assert.equal(ffMax, 3.00);

  // Defender has 0 or negligible stats: clamps at 1.00
  const ffMin = calculateFairFight(1_000_000, 0);
  assert.equal(ffMin, 1.00);
});

test("solveDefenderStatsFromFF recovers Defender stats accurately in linear region", () => {
  const attackerTBS = 10_000_000;
  // FF = 1.89
  // Defender = Attacker * (FF - 1) * 1.125 = 10,000,000 * 0.89 * 1.125 = 10,012,500
  const estimate = solveDefenderStatsFromFF(attackerTBS, 1.89, 12345);

  assert.equal(estimate.defenderId, 12345);
  assert.equal(estimate.confidence, "TIGHT");
  assert.equal(estimate.estimatedTBS, 10_012_500);

  // Verify tight bounds from 2 decimal rounding [1.885, 1.895)
  // min: 10,000,000 * 0.885 * 1.125 = 9,956,250
  // max: 10,000,000 * 0.895 * 1.125 = 10,068,750
  assert.equal(estimate.minTBS, 9_956_250);
  assert.equal(estimate.maxTBS, 10_068_750);
});

test("solveDefenderStatsFromFF handles floor and ceiling clamps", () => {
  const attackerTBS = 1_000_000;

  // Floor clamp (FF <= 1.00)
  const floorEstimate = solveDefenderStatsFromFF(attackerTBS, 1.00);
  assert.equal(floorEstimate.confidence, "CEILING_ONLY");
  assert.equal(floorEstimate.maxTBS, 220_000); // 22% of attacker
  assert.ok(floorEstimate.estimatedTBS <= 220_000);

  // Ceiling clamp (FF >= 3.00)
  const ceilingEstimate = solveDefenderStatsFromFF(attackerTBS, 3.00);
  assert.equal(ceilingEstimate.confidence, "FLOOR_ONLY");
  assert.equal(ceilingEstimate.minTBS, 2_250_000); // 225% of attacker
});

test("stat-estimator reverseFairFight is reconciled with canonical 1.125 constant", () => {
  const attackerStats = 5_000_000;
  const ff = 1.65;

  const statEstimate = reverseFairFight(attackerStats, ff);
  const directSolved = solveDefenderStatsFromFF(attackerStats, ff);

  // Must match exactly
  assert.equal(statEstimate.est, directSolved.estimatedTBS);
  assert.equal(statEstimate.min, directSolved.minTBS);
  assert.equal(statEstimate.max, directSolved.maxTBS);

  // Check expected linear math: 5M * (1.65 - 1) * 1.125 = 5M * 0.65 * 1.125 = 3,656,250
  assert.equal(statEstimate.est, 3_656_250);
});

test("combineMultiHitEstimates narrows confidence bounds across multiple attackers", () => {
  const hits = [
    { attackerTBS: 10_000_000, fairFight: 1.50, defenderId: 999 }, // est: 5.625M, range: [5.568M, 5.681M]
    { attackerTBS: 5_000_000, fairFight: 2.00, defenderId: 999 },  // est: 5.625M, range: [5.596M, 5.653M]
  ];

  const combined = combineMultiHitEstimates(hits);
  assert.ok(combined);
  assert.equal(combined.defenderId, 999);
  assert.equal(combined.hitsCount, 2);
  assert.ok(combined.confidencePercentage > 85);
  // Point estimate converges near 5.625M
  assert.ok(Math.abs(combined.pointEstimate - 5_625_000) < 50_000);
});

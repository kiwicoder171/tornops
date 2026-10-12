import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateWarPayout,
  exportPayoutToJson,
  exportPayoutToCsv,
} from "../dist/payout-calculator.js";
import {
  optimizeCrimeTeam,
  findStalledInvites,
  OC_TEMPLATES,
} from "../dist/oc-optimizer.js";
import {
  getChainAlertLevel,
  isClutchHit,
  formatChainTime,
} from "../dist/chain-math.js";

test("Chain Alert Level transitions correctly", () => {
  assert.equal(getChainAlertLevel(150), "NORMAL");
  assert.equal(getChainAlertLevel(120), "WARNING_120");
  assert.equal(getChainAlertLevel(90), "WARNING_120");
  assert.equal(getChainAlertLevel(60), "HIGH_60");
  assert.equal(getChainAlertLevel(45), "HIGH_60");
  assert.equal(getChainAlertLevel(30), "EMERGENCY_30");
  assert.equal(getChainAlertLevel(10), "EMERGENCY_30");
  assert.equal(getChainAlertLevel(0), "NORMAL");
});

test("Clutch Hit and Chain Time formatting", () => {
  assert.equal(isClutchHit(25), true);
  assert.equal(isClutchHit(45), false);
  assert.equal(formatChainTime(125), "02:05");
  assert.equal(formatChainTime(29), "00:29");
});

test("War Payout Calculation computes fair-share distribution", () => {
  const attacks = [
    {
      code: "a1",
      timestampStarted: 100,
      timestampEnded: 105,
      attackerId: 1001,
      attackerName: "Commander",
      attackerFactionId: 777,
      defenderId: 2001,
      defenderName: "Enemy1",
      defenderFactionId: 888,
      result: "Hospitalized",
      respectGain: 4.5,
      chain: 10,
      fairFight: 1.2,
      isClutchSave: true,
    },
    {
      code: "a2",
      timestampStarted: 120,
      timestampEnded: 125,
      attackerId: 1002,
      attackerName: "Soldier",
      attackerFactionId: 777,
      defenderId: 2002,
      defenderName: "Enemy2",
      defenderFactionId: 888,
      result: "Hospitalized",
      respectGain: 2.0,
      chain: 11,
      fairFight: 1.0,
      isClutchSave: false,
    },
    {
      code: "a3",
      timestampStarted: 130,
      timestampEnded: 135,
      attackerId: 1002,
      attackerName: "Soldier",
      attackerFactionId: 777,
      defenderId: 2003,
      defenderName: "Enemy3",
      defenderFactionId: 888,
      result: "Lost",
      respectGain: 0,
      chain: 0,
      fairFight: 1.0,
    },
  ];

  const totalPool = 10000000; // $10,000,000
  const result = calculateWarPayout(1234, totalPool, attacks, 777);

  assert.equal(result.totalHits, 2);
  assert.equal(result.totalRespect, 6.5);
  assert.equal(result.memberPayouts.length, 2);

  // Commander has higher score due to clutch save and higher respect
  const commander = result.memberPayouts.find((m) => m.playerId === 1001);
  const soldier = result.memberPayouts.find((m) => m.playerId === 1002);

  assert.ok(commander);
  assert.ok(soldier);
  assert.ok(commander.finalPayout > soldier.finalPayout);
  assert.equal(commander.finalPayout + soldier.finalPayout <= totalPool, true);

  // Test JSON & CSV export
  const jsonExport = exportPayoutToJson(result.memberPayouts);
  const parsed = JSON.parse(jsonExport);
  assert.equal(parsed["1001"], commander.finalPayout);

  const csvExport = exportPayoutToCsv(result.memberPayouts);
  assert.ok(csvExport.includes("Commander"));
  assert.ok(csvExport.includes("Soldier"));
});

test("OC 2.0 Optimizer matches highest skilled members and identifies stalled invites", () => {
  const members = [
    {
      playerId: 1,
      playerName: "Alice",
      skills: { burglary: 80, cracking: 60, scamming: 20, cybercrime: 10, illicitServices: 10, disposal: 10, forgery: 10, searchForCash: 10, bootlegging: 10, graffiti: 10, shoplifting: 10, pickpocketing: 10, cardsSkimming: 10, hustling: 10, extortion: 10 },
      isAvailable: true,
    },
    {
      playerId: 2,
      playerName: "Bob",
      skills: { burglary: 40, cracking: 90, scamming: 30, cybercrime: 20, illicitServices: 10, disposal: 10, forgery: 10, searchForCash: 10, bootlegging: 10, graffiti: 10, shoplifting: 10, pickpocketing: 10, cardsSkimming: 10, hustling: 10, extortion: 10 },
      isAvailable: true,
    },
    {
      playerId: 3,
      playerName: "Charlie",
      skills: { burglary: 50, cracking: 40, scamming: 20, cybercrime: 10, illicitServices: 10, disposal: 10, forgery: 10, searchForCash: 10, bootlegging: 10, graffiti: 10, shoplifting: 10, pickpocketing: 10, cardsSkimming: 10, hustling: 10, extortion: 10 },
      isAvailable: true,
    },
  ];

  const team = optimizeCrimeTeam(OC_TEMPLATES[0], members);
  assert.equal(team.assignments.length, 3);
  assert.ok(team.overallSuccessRate > 80);

  // Check stalled invite
  const stalledMembers = [
    {
      playerId: 99,
      playerName: "SleepyHead",
      skills: {},
      isAvailable: false,
      pendingInviteCrimeId: 501,
      inviteSentTimestamp: Math.floor(Date.now() / 1000) - 3600 * 8, // 8 hours ago
    },
  ];
  const stalled = findStalledInvites(stalledMembers, 6);
  assert.equal(stalled.length, 1);
  assert.equal(stalled[0].playerName, "SleepyHead");
});

test("Timezone conversion and 24h TCT coverage calculations", async () => {
  const {
    isHourInRange,
    localHourToTctHour,
    tctHourToLocalHour,
    isMemberAwakeAtTct,
    compute24hCoverage,
    analyzeCoverageShifts,
    DEMO_FACTION_TIMEZONES,
  } = await import("../dist/timezone.js");

  // Local hour 12:00 in UTC+7 is 05:00 TCT (12 - 7 = 5)
  assert.equal(localHourToTctHour(12, 7), 5);
  // Local hour 02:00 in UTC-4 is 06:00 TCT (2 - (-4) = 6)
  assert.equal(localHourToTctHour(2, -4), 6);
  // TCT hour 05:00 in UTC+7 is 12:00 Local (5 + 7 = 12)
  assert.equal(tctHourToLocalHour(5, 7), 12);

  // Wrap around midnight checks
  assert.equal(isHourInRange(23, 22, 6), true);
  assert.equal(isHourInRange(3, 22, 6), true);
  assert.equal(isHourInRange(12, 22, 6), false);

  // Check demo member awake calculation
  const ek = DEMO_FACTION_TIMEZONES[0]; // Eklatant, UTC+1, awake 7-23
  // At 12:00 TCT, local time is 13:00 -> awake
  assert.equal(isMemberAwakeAtTct(ek, 12), true);
  // At 03:00 TCT, local time is 04:00 -> asleep
  assert.equal(isMemberAwakeAtTct(ek, 3), false);

  // Compute 24h coverage
  const coverage = compute24hCoverage(DEMO_FACTION_TIMEZONES);
  assert.equal(coverage.length, 24);
  assert.ok(coverage[14].awakeCount > 0);

  // Analyze shift alerts
  const alerts = analyzeCoverageShifts(coverage);
  assert.ok(alerts.length > 0);
});

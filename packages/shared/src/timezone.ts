export interface FactionMemberAvailability {
  memberId: number;
  name: string;
  level: number;
  position?: string;
  timezone: string; // e.g. "America/New_York", "Europe/London", "Asia/Bangkok", "Australia/Sydney"
  timezoneLabel: string; // e.g. "US Eastern (EDT/EST, UTC-4)"
  utcOffset: number; // e.g. -4, +0, +1, +7, +10
  awakeStartLocal: number; // 0-23 (e.g. 8 for 08:00)
  awakeEndLocal: number; // 0-23 (e.g. 23 for 23:00)
  chainWatchStartTct: number; // 0-23 in TCT (e.g. 14 for 14:00 TCT)
  chainWatchEndTct: number; // 0-23 in TCT (e.g. 20 for 20:00 TCT)
  warPreference: "WEEKEND" | "WEEKDAY" | "ALL";
  ocReady: boolean;
  ocPreferredTct?: string; // e.g. "12:00 - 18:00 TCT"
  lastActionStatus?: "Online" | "Idle" | "Offline";
  inGameStatus?: "Okay" | "Hospital" | "Traveling" | "Jail" | "Abroad";
  notes?: string;
}

export interface HourlyCoverageData {
  hour: number; // 0 - 23 TCT
  label: string; // "00:00", "01:00", ...
  awakeMembers: FactionMemberAvailability[];
  chainWatchMembers: FactionMemberAvailability[];
  awakeCount: number;
  chainWatchCount: number;
  coverageRatio: number; // 0 to 1
  riskLevel: "CRITICAL" | "MODERATE" | "OPTIMAL"; // CRITICAL if < 20% awake or < 4, MODERATE if 20-50%, OPTIMAL if > 50%
}

export interface ShiftAlert {
  type: "VULNERABLE_WINDOW" | "PEAK_PUSH" | "OC_ALIGNMENT";
  title: string;
  description: string;
  tctWindow: string; // e.g. "03:00 - 07:00 TCT"
  severity: "HIGH" | "MEDIUM" | "INFO";
}

/**
 * Checks if a given hour (0-23) falls within [start, end].
 * Handles overnight wraps (e.g., start 22, end 6).
 */
export function isHourInRange(hour: number, start: number, end: number): boolean {
  const h = ((hour % 24) + 24) % 24;
  const s = ((start % 24) + 24) % 24;
  const e = ((end % 24) + 24) % 24;

  if (s <= e) {
    return h >= s && h <= e;
  }
  // Wrap-around across midnight (e.g. 22:00 to 06:00)
  return h >= s || h <= e;
}

/**
 * Converts a Local hour (0-23) to Torn City Time (TCT / UTC).
 */
export function localHourToTctHour(localHour: number, utcOffset: number): number {
  return ((localHour - Math.round(utcOffset)) % 24 + 24) % 24;
}

/**
 * Converts a TCT hour (0-23) to Local hour given UTC offset.
 */
export function tctHourToLocalHour(tctHour: number, utcOffset: number): number {
  return ((tctHour + Math.round(utcOffset)) % 24 + 24) % 24;
}

/**
 * Returns whether a member is considered awake at a specific TCT hour.
 */
export function isMemberAwakeAtTct(member: FactionMemberAvailability, tctHour: number): boolean {
  const memberLocalHour = tctHourToLocalHour(tctHour, member.utcOffset);
  return isHourInRange(memberLocalHour, member.awakeStartLocal, member.awakeEndLocal);
}

/**
 * Returns whether a member is scheduled for Chain Watch duty at a specific TCT hour.
 */
export function isMemberOnChainWatchAtTct(member: FactionMemberAvailability, tctHour: number): boolean {
  return isHourInRange(tctHour, member.chainWatchStartTct, member.chainWatchEndTct);
}

/**
 * Formats an hour number to 24h TCT string e.g. 8 -> "08:00 TCT"
 */
export function formatTctHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  return `${h.toString().padStart(2, "0")}:00 TCT`;
}

/**
 * Generates the 24-hour TCT coverage distribution for the faction roster.
 */
export function compute24hCoverage(members: FactionMemberAvailability[]): HourlyCoverageData[] {
  const total = Math.max(members.length, 1);

  return Array.from({ length: 24 }, (_, hour) => {
    const awake = members.filter((m) => isMemberAwakeAtTct(m, hour));
    const chainWatch = members.filter((m) => isMemberOnChainWatchAtTct(m, hour));
    const awakeCount = awake.length;
    const ratio = awakeCount / total;

    let riskLevel: "CRITICAL" | "MODERATE" | "OPTIMAL" = "OPTIMAL";
    if (awakeCount < 4 || ratio < 0.25) {
      riskLevel = "CRITICAL";
    } else if (ratio < 0.55) {
      riskLevel = "MODERATE";
    }

    return {
      hour,
      label: `${hour.toString().padStart(2, "0")}:00`,
      awakeMembers: awake,
      chainWatchMembers: chainWatch,
      awakeCount,
      chainWatchCount: chainWatch.length,
      coverageRatio: ratio,
      riskLevel,
    };
  });
}

/**
 * Identifies vulnerable windows and optimal war push windows from coverage data.
 */
export function analyzeCoverageShifts(coverage: HourlyCoverageData[]): ShiftAlert[] {
  const alerts: ShiftAlert[] = [];

  // Find consecutive critical hours (< 25% awake or < 4)
  let critStart: number | null = null;
  let critEnd: number | null = null;

  for (let i = 0; i < 24; i++) {
    const item = coverage[i];
    if (item.riskLevel === "CRITICAL") {
      if (critStart === null) critStart = i;
      critEnd = i;
    } else {
      if (critStart !== null && critEnd !== null) {
        alerts.push({
          type: "VULNERABLE_WINDOW",
          title: "Low Faction Presence Warning",
          description: `Only an average of ${Math.round(
            coverage.slice(critStart, critEnd + 1).reduce((acc, c) => acc + c.awakeCount, 0) /
              (critEnd - critStart + 1)
          )} members are awake. Chains are at high risk of dropping without designated watchers.`,
          tctWindow: `${critStart.toString().padStart(2, "0")}:00 - ${((critEnd + 1) % 24).toString().padStart(2, "0")}:00 TCT`,
          severity: "HIGH",
        });
        critStart = null;
        critEnd = null;
      }
    }
  }

  if (critStart !== null && critEnd !== null) {
    alerts.push({
      type: "VULNERABLE_WINDOW",
      title: "Vulnerable Chain Shift",
      description: "Low presence window across night boundary. Critical defense watch recommended.",
      tctWindow: `${critStart.toString().padStart(2, "0")}:00 - ${((critEnd + 1) % 24).toString().padStart(2, "0")}:00 TCT`,
      severity: "HIGH",
    });
  }

  // Peak push window (highest coverage cluster)
  let bestWindowStart = 0;
  let maxAwakeSum = 0;
  for (let i = 0; i < 24; i++) {
    const sum =
      coverage[i].awakeCount +
      coverage[(i + 1) % 24].awakeCount +
      coverage[(i + 2) % 24].awakeCount;
    if (sum > maxAwakeSum) {
      maxAwakeSum = sum;
      bestWindowStart = i;
    }
  }

  alerts.push({
    type: "PEAK_PUSH",
    title: "Prime Faction Push Window",
    description: `Faction reaches maximum combat readiness (~${Math.round(
      maxAwakeSum / 3
    )} members active). Best time to coordinate ranked war attacks and territory hits.`,
    tctWindow: `${bestWindowStart.toString().padStart(2, "0")}:00 - ${((bestWindowStart + 3) % 24).toString().padStart(2, "0")}:00 TCT`,
    severity: "INFO",
  });

  return alerts;
}

/**
 * Standard Global Timezones preset list with common Torn player hubs.
 */
export const GLOBAL_TIMEZONES_PRESET = [
  { value: "America/Los_Angeles", label: "US Pacific (PST/PDT)", offset: -7, region: "AMERICAS" },
  { value: "America/Denver", label: "US Mountain (MST/MDT)", offset: -6, region: "AMERICAS" },
  { value: "America/Chicago", label: "US Central (CST/CDT)", offset: -5, region: "AMERICAS" },
  { value: "America/New_York", label: "US Eastern (EST/EDT)", offset: -4, region: "AMERICAS" },
  { value: "America/Sao_Paulo", label: "Brazil (BRT)", offset: -3, region: "AMERICAS" },
  { value: "Atlantic/Reykjavik", label: "Iceland (GMT / TCT)", offset: 0, region: "EUROPE" },
  { value: "Europe/London", label: "UK / Ireland (GMT/BST)", offset: 1, region: "EUROPE" },
  { value: "Europe/Paris", label: "Central Europe (CET/CEST)", offset: 2, region: "EUROPE" },
  { value: "Europe/Helsinki", label: "Eastern Europe (EET/EEST)", offset: 3, region: "EUROPE" },
  { value: "Asia/Dubai", label: "Gulf Standard (GST)", offset: 4, region: "ASIA" },
  { value: "Asia/Kolkata", label: "India Standard (IST)", offset: 5.5, region: "ASIA" },
  { value: "Asia/Bangkok", label: "Indochina (ICT)", offset: 7, region: "ASIA" },
  { value: "Asia/Singapore", label: "Singapore / Western Aus (SGT)", offset: 8, region: "ASIA" },
  { value: "Asia/Tokyo", label: "Japan Standard (JST)", offset: 9, region: "ASIA" },
  { value: "Australia/Sydney", label: "Australian Eastern (AEST/AEDT)", offset: 11, region: "OCEANIA" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST/NZDT)", offset: 13, region: "OCEANIA" },
];

/**
 * Realistic default roster seed for Mildly Dangerous / Demo factions.
 */
export const DEMO_FACTION_TIMEZONES: FactionMemberAvailability[] = [
  {
    memberId: 4430788,
    name: "Eklatant",
    level: 75,
    position: "Leader",
    timezone: "Europe/London",
    timezoneLabel: "UK (GMT/BST, UTC+1)",
    utcOffset: 1,
    awakeStartLocal: 7,
    awakeEndLocal: 23,
    chainWatchStartTct: 10,
    chainWatchEndTct: 18,
    warPreference: "ALL",
    ocReady: true,
    ocPreferredTct: "12:00 - 18:00 TCT",
    lastActionStatus: "Online",
    inGameStatus: "Okay",
    notes: "Main war commander and primary chain coordinator.",
  },
  {
    memberId: 4072152,
    name: "kisagikun",
    level: 42,
    position: "Co-Leader",
    timezone: "Asia/Bangkok",
    timezoneLabel: "Southeast Asia (ICT, UTC+7)",
    utcOffset: 7,
    awakeStartLocal: 8,
    awakeEndLocal: 24,
    chainWatchStartTct: 3,
    chainWatchEndTct: 11,
    warPreference: "ALL",
    ocReady: true,
    ocPreferredTct: "06:00 - 12:00 TCT",
    lastActionStatus: "Online",
    inGameStatus: "Okay",
    notes: "Crucial early morning TCT timezone anchor.",
  },
  {
    memberId: 4552150,
    name: "NongGuyver",
    level: 6,
    position: "Member",
    timezone: "Asia/Bangkok",
    timezoneLabel: "Southeast Asia (ICT, UTC+7)",
    utcOffset: 7,
    awakeStartLocal: 8,
    awakeEndLocal: 23,
    chainWatchStartTct: 5,
    chainWatchEndTct: 12,
    warPreference: "WEEKEND",
    ocReady: true,
    ocPreferredTct: "08:00 TCT",
    lastActionStatus: "Online",
    inGameStatus: "Okay",
    notes: "Active leveling recruit, eager for weekend chains.",
  },
  {
    memberId: 3829104,
    name: "IronHide",
    level: 68,
    position: "Peacekeeper",
    timezone: "America/New_York",
    timezoneLabel: "US Eastern (EDT, UTC-4)",
    utcOffset: -4,
    awakeStartLocal: 8,
    awakeEndLocal: 23,
    chainWatchStartTct: 16,
    chainWatchEndTct: 23,
    warPreference: "ALL",
    ocReady: true,
    ocPreferredTct: "18:00 - 22:00 TCT",
    lastActionStatus: "Online",
    inGameStatus: "Okay",
    notes: "Evening war pusher & heavy hitter.",
  },
  {
    memberId: 3912048,
    name: "Valkyrie",
    level: 59,
    position: "War Specialist",
    timezone: "America/Los_Angeles",
    timezoneLabel: "US Pacific (PDT, UTC-7)",
    utcOffset: -7,
    awakeStartLocal: 8,
    awakeEndLocal: 24,
    chainWatchStartTct: 19,
    chainWatchEndTct: 3,
    warPreference: "ALL",
    ocReady: true,
    ocPreferredTct: "20:00 - 02:00 TCT",
    lastActionStatus: "Idle",
    inGameStatus: "Okay",
    notes: "Late night Americas defender, prevents US chain drops.",
  },
  {
    memberId: 4102931,
    name: "ShadowBane",
    level: 54,
    position: "Member",
    timezone: "Europe/Paris",
    timezoneLabel: "Central Europe (CEST, UTC+2)",
    utcOffset: 2,
    awakeStartLocal: 7,
    awakeEndLocal: 23,
    chainWatchStartTct: 8,
    chainWatchEndTct: 16,
    warPreference: "WEEKEND",
    ocReady: true,
    ocPreferredTct: "14:00 TCT",
    lastActionStatus: "Offline",
    inGameStatus: "Hospital",
    notes: "Weekend war availability only due to work.",
  },
  {
    memberId: 4440528,
    name: "NightStalker",
    level: 64,
    position: "Enforcer",
    timezone: "Australia/Sydney",
    timezoneLabel: "Australia Eastern (AEST, UTC+10)",
    utcOffset: 10,
    awakeStartLocal: 7,
    awakeEndLocal: 23,
    chainWatchStartTct: 0,
    chainWatchEndTct: 8,
    warPreference: "ALL",
    ocReady: true,
    ocPreferredTct: "02:00 - 06:00 TCT",
    lastActionStatus: "Online",
    inGameStatus: "Okay",
    notes: "Key Oceanic watcher during Americas deep sleep.",
  },
  {
    memberId: 3781290,
    name: "SteelFox",
    level: 48,
    position: "Member",
    timezone: "America/Chicago",
    timezoneLabel: "US Central (CDT, UTC-5)",
    utcOffset: -5,
    awakeStartLocal: 9,
    awakeEndLocal: 23,
    chainWatchStartTct: 17,
    chainWatchEndTct: 23,
    warPreference: "WEEKDAY",
    ocReady: false,
    ocPreferredTct: "Off-duty weekends",
    lastActionStatus: "Offline",
    inGameStatus: "Traveling",
    notes: "Available mostly during weekday remote work hours.",
  },
  {
    memberId: 3654129,
    name: "FrostBite",
    level: 71,
    position: "Banker",
    timezone: "Europe/Helsinki",
    timezoneLabel: "Scandinavia / Finland (EEST, UTC+3)",
    utcOffset: 3,
    awakeStartLocal: 8,
    awakeEndLocal: 23,
    chainWatchStartTct: 9,
    chainWatchEndTct: 15,
    warPreference: "ALL",
    ocReady: true,
    ocPreferredTct: "11:00 TCT",
    lastActionStatus: "Online",
    inGameStatus: "Okay",
    notes: "Manages morning banking shifts and OC disbursements.",
  },
  {
    memberId: 4210984,
    name: "ApexPredator",
    level: 51,
    position: "Member",
    timezone: "America/New_York",
    timezoneLabel: "US Eastern (EDT, UTC-4)",
    utcOffset: -4,
    awakeStartLocal: 8,
    awakeEndLocal: 24,
    chainWatchStartTct: 18,
    chainWatchEndTct: 24,
    warPreference: "WEEKEND",
    ocReady: true,
    ocPreferredTct: "20:00 TCT",
    lastActionStatus: "Idle",
    inGameStatus: "Okay",
    notes: "High battle stats for weekend ranked wars.",
  },
];

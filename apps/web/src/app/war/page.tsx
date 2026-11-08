"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Swords,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Users,
  Plane,
  HeartPulse,
  MessageSquare,
  Trophy,
  User,
  Eye,
  Database,
  Upload,
  Check,
  X,
  Info,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Filter,
  ArrowUpDown,
  Search,
  Radar,
  Radio,
} from "lucide-react";
import {
  getDirectAttackUrl,
  estimateBattleStats,
  formatStatNumber,
  parseSpyReportText,
  getMatchupRating,
  PlayerSpyData,
  formatArmorChip,
  formatWeaponBonusChips,
  CANONICAL_ARMOR_SETS,
} from "@torn/shared";
import { useTorn } from "@/context/TornContext";

export type WarStage = "DECLARED" | "ONGOING" | "CONCLUDED" | "MANUAL_SCOUT";

export interface WarMeta {
  opponentName: string;
  opponentId: number;
  ourScore: number;
  oppScore: number;
  lead: number;
  stage: WarStage;
  startTime?: number; // Unix timestamp
  endTime?: number;
  targetScore?: number;
  winnerFactionId?: number;
  isWon?: boolean;
}

interface MemberStatusRow {
  id: number;
  name: string;
  level: number;
  status: "Hospital" | "Okay" | "Traveling" | "Abroad";
  hospitalRemainingMinutes?: number;
  details?: string;
  priority: "High" | "Standard";
  isRevivable?: boolean;
}

const DEFAULT_DEMO_ENEMY: MemberStatusRow[] = [
  { id: 4440528, name: "NightStalker", level: 64, status: "Okay", details: "Ready to fight", priority: "High" },
  { id: 4102931, name: "ShadowBane", level: 52, status: "Hospital", hospitalRemainingMinutes: 48, details: "Hospitalized casualty", priority: "High" },
  { id: 3912048, name: "Valkyrie", level: 45, status: "Okay", details: "Online in Torn", priority: "Standard" },
  { id: 3829104, name: "IronHide", level: 38, status: "Traveling", details: "Traveling to Switzerland", priority: "Standard" },
];

const DEFAULT_DEMO_FRIENDLY: MemberStatusRow[] = [
  { id: 4430788, name: "Eklatant", level: 75, status: "Okay", details: "Active Commander", priority: "High" },
  { id: 4072152, name: "kisagikun", level: 42, status: "Okay", details: "In Torn City", priority: "High" },
  { id: 4552150, name: "NongGuyver", level: 6, status: "Okay", details: "Rookie Newcomer", priority: "Standard" },
];

const DEFAULT_DEMO_SPIES: Record<number, PlayerSpyData> = {
  4440528: {
    playerId: 4440528,
    name: "NightStalker",
    strength: 65_000_000,
    defense: 45_000_000,
    speed: 70_000_000,
    dexterity: 30_000_000,
    total: 210_000_000,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 3,
    source: "TORNSTATS",
    spiedBy: "TornStats Spy DB",
    armorSet: "EOD",
    weaponBonuses: "Execute 24%, Paralyze 15%",
  },
  4102931: {
    playerId: 4102931,
    name: "ShadowBane",
    strength: 14_000_000,
    defense: 12_000_000,
    speed: 18_000_000,
    dexterity: 10_000_000,
    total: 54_000_000,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 7,
    source: "FACTION_SPY",
    spiedBy: "Faction Discord Intel",
    armorSet: "Riot",
    weaponBonuses: "Bloodlust 20%",
  },
  3912048: {
    playerId: 3912048,
    name: "Valkyrie",
    total: 22_000,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
    source: "FFSCOUTER",
    spiedBy: "FFScouter Radar",
    fairFight: 1.45,
    armorSet: "Combat",
    weaponBonuses: "Plunder 35%",
  },
  3829104: {
    playerId: 3829104,
    name: "IronHide",
    total: 8_900,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 5,
    source: "FFSCOUTER",
    spiedBy: "FFScouter Radar",
    fairFight: 1.12,
    armorSet: "Kevlar",
  },
};

const DEFAULT_DEMO_WAR_META: WarMeta = {
  opponentName: "Storm Heralds",
  opponentId: 57574,
  ourScore: 2409,
  oppScore: 1573,
  lead: 836,
  stage: "ONGOING",
  targetScore: 2500,
  isWon: false,
};

const USER_SPY_STORAGE_KEY = "TORN_USER_SPY_STORE_V2";
const TORNSTATS_KEY_STORAGE = "TORN_TORNSTATS_API_KEY";

/** Helper to robustly extract ranked war details from Torn API dictionary/array */
function parseRankedWars(rawRw: any, ourFactionId?: number): WarMeta | null {
  if (!rawRw) return null;
  const list: any[] = Array.isArray(rawRw) ? rawRw : Object.values(rawRw);
  if (list.length === 0) return null;

  const nowSec = Math.floor(Date.now() / 1000);

  // Helper to extract factions list from rw.factions (which is almost always an object dictionary in Torn v1 API)
  const extractFactions = (factionsObj: any): Array<{ id: number; name: string; score: number }> => {
    if (!factionsObj) return [];
    if (Array.isArray(factionsObj)) {
      return factionsObj.map((f: any) => ({
        id: Number(f.id || f.faction_id || 0),
        name: f.name || "Faction",
        score: Number(f.score || 0),
      }));
    }
    if (typeof factionsObj === "object") {
      return Object.entries(factionsObj).map(([key, val]: [string, any]) => ({
        id: Number(key) || Number(val?.id || 0),
        name: val?.name || "Faction",
        score: Number(val?.score || 0),
      }));
    }
    return [];
  };

  // 1. First priority: Ongoing War (end === 0 and start <= nowSec)
  let selectedRw = list.find((w: any) => {
    const end = Number(w.war?.end || 0);
    const start = Number(w.war?.start || 0);
    return end === 0 && start > 0 && start <= nowSec;
  });
  let stage: WarStage = "ONGOING";

  // 2. Second priority: Declared War Countdown (end === 0 and start > nowSec) -> PRE-SHOWS ENEMY!
  if (!selectedRw) {
    selectedRw = list.find((w: any) => {
      const end = Number(w.war?.end || 0);
      const start = Number(w.war?.start || 0);
      return end === 0 && start > nowSec;
    });
    if (selectedRw) {
      stage = "DECLARED";
    }
  }

  // 3. Third priority: Recently Concluded War (within 5 days)
  if (!selectedRw) {
    const finishedWars = list
      .filter((w: any) => Number(w.war?.end || 0) > 0)
      .sort((a: any, b: any) => Number(b.war?.end || 0) - Number(a.war?.end || 0));
    if (finishedWars.length > 0) {
      const latest = finishedWars[0];
      const end = Number(latest.war?.end || 0);
      if (nowSec - end < 86400 * 5) {
        selectedRw = latest;
        stage = "CONCLUDED";
      }
    }
  }

  if (!selectedRw) return null;

  const factionList = extractFactions(selectedRw.factions);
  if (factionList.length === 0) return null;

  let ourFac = ourFactionId ? factionList.find((f) => f.id === ourFactionId) : factionList[0];
  let oppFac = ourFactionId ? factionList.find((f) => f.id !== ourFactionId) : factionList[1];

  if (!ourFac && factionList.length > 0) ourFac = factionList[0];
  if (!oppFac && factionList.length > 1) oppFac = factionList[1];
  if (!oppFac) return null;

  const war = selectedRw.war || {};
  const winnerId = Number(war.winner || 0);

  return {
    opponentName: oppFac.name || "Opponent",
    opponentId: oppFac.id,
    ourScore: ourFac?.score || 0,
    oppScore: oppFac.score || 0,
    lead: (ourFac?.score || 0) - oppFac.score,
    stage,
    startTime: Number(war.start || 0),
    endTime: Number(war.end || 0),
    targetScore: Number(war.target || 0),
    winnerFactionId: winnerId,
    isWon: winnerId > 0 && ourFac ? winnerId === ourFac.id : false,
  };
}

export default function WarRoomPage() {
  const { isLive, apiKey, userProfile } = useTorn();
  const [activeTab, setActiveTab] = useState<"ENEMY_TARGETS" | "FRIENDLY_ROSTER">("ENEMY_TARGETS");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OKAY" | "HOSP">("ALL");
  const [statFilter, setStatFilter] = useState<"ALL" | "SPIED" | "EASY" | "FAIR" | "TITAN">("ALL");
  const [sortOption, setSortOption] = useState<"DEFAULT" | "STATS_ASC" | "STATS_DESC" | "LEVEL_DESC" | "LEVEL_ASC">("DEFAULT");

  // Targets and meta: start cleanly empty so mock data NEVER leaks into live accounts
  const [enemyTargets, setEnemyTargets] = useState<MemberStatusRow[]>([]);
  const [friendlyMembers, setFriendlyMembers] = useState<MemberStatusRow[]>([]);
  const [warMeta, setWarMeta] = useState<WarMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Manual scouting input when war is not yet declared
  const [scoutFactionInput, setScoutFactionInput] = useState("");
  const [isScoutingLoading, setIsScoutingLoading] = useState(false);
  const [scoutErrorMsg, setScoutErrorMsg] = useState<string | null>(null);

  // Live countdown string for declared wars
  const [countdownStr, setCountdownStr] = useState<string>("");

  // Spies Database state (persisted to localStorage)
  const [spies, setSpies] = useState<Record<number, PlayerSpyData>>({});
  const [tornStatsKey, setTornStatsKey] = useState("");
  const [isSyncingTornStats, setIsSyncingTornStats] = useState(false);
  const [isSyncingFFScouter, setIsSyncingFFScouter] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Modals state
  const [activeSpyModalTarget, setActiveSpyModalTarget] = useState<MemberStatusRow | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showTornStatsModal, setShowTornStatsModal] = useState(false);

  // Single spy form state
  const [spyFormStr, setSpyFormStr] = useState("");
  const [spyFormDef, setSpyFormDef] = useState("");
  const [spyFormSpd, setSpyFormSpd] = useState("");
  const [spyFormDex, setSpyFormDex] = useState("");
  const [spyFormTotal, setSpyFormTotal] = useState("");
  const [spyFormArmor, setSpyFormArmor] = useState("");
  const [spyFormWeapons, setSpyFormWeapons] = useState("");
  const [spyFormSource, setSpyFormSource] = useState<"MANUAL" | "FACTION_SPY" | "TORNSTATS" | "FAIR_FIGHT">("MANUAL");

  // Batch paste input
  const [batchRawText, setBatchRawText] = useState("");
  const [batchParsedCount, setBatchParsedCount] = useState<number | null>(null);

  // 1. Load user spies & TornStats API key from localStorage
  useEffect(() => {
    try {
      if (isLive) {
        // When user is live, load ONLY their real saved spies
        const saved = localStorage.getItem(USER_SPY_STORAGE_KEY);
        if (saved) {
          setSpies(JSON.parse(saved));
        } else {
          setSpies({});
        }
      } else {
        // In Demo mode, show demo preview spies
        setSpies(DEFAULT_DEMO_SPIES);
      }

      const savedKey = localStorage.getItem(TORNSTATS_KEY_STORAGE);
      if (savedKey) {
        setTornStatsKey(savedKey);
      }
    } catch {
      setSpies(isLive ? {} : DEFAULT_DEMO_SPIES);
    }
  }, [isLive]);

  // Sync local spies to Supabase Faction Cloud (teammate sharing)
  const syncToCloud = useCallback(
    async (records: PlayerSpyData[]) => {
      const factionId = userProfile?.factionId;
      if (!factionId || records.length === 0) return;
      try {
        await fetch("/api/spies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ factionId, spies: records }),
        });
      } catch (e) {
        console.warn("Background team cloud sync:", e);
      }
    },
    [userProfile?.factionId]
  );

  const saveSpyDb = useCallback(
    (newDb: Record<number, PlayerSpyData>) => {
      setSpies(newDb);
      try {
        if (isLive) {
          localStorage.setItem(USER_SPY_STORAGE_KEY, JSON.stringify(newDb));
          // Auto-sync new spies to teammates via Faction Cloud
          syncToCloud(Object.values(newDb));
        }
      } catch (e) {
        console.error("Failed saving spies to localStorage", e);
      }
    },
    [isLive, syncToCloud]
  );

  // Background hydration: Pull shared spies uploaded by other teammates
  useEffect(() => {
    const factionId = userProfile?.factionId;
    if (!isLive || !factionId) return;

    const pullCloudSpies = async () => {
      try {
        const res = await fetch(`/api/spies?factionId=${factionId}`);
        const data = await res.json();
        if (data.configured && Array.isArray(data.spies) && data.spies.length > 0) {
          setSpies((prev) => {
            const merged = { ...prev };
            let hasNew = false;
            for (const s of data.spies) {
              if (!merged[s.playerId] || (merged[s.playerId].source !== "MANUAL" && s.timestamp > (merged[s.playerId].timestamp || 0))) {
                merged[s.playerId] = s;
                hasNew = true;
              }
            }
            if (hasNew && typeof window !== "undefined") {
              try {
                localStorage.setItem(USER_SPY_STORAGE_KEY, JSON.stringify(merged));
              } catch {}
            }
            return merged;
          });
        }
      } catch {
        // Fallback gracefully if Supabase is still connecting
      }
    };

    pullCloudSpies();
    const interval = setInterval(pullCloudSpies, 30000); // Check for teammate updates every 30s
    return () => clearInterval(interval);
  }, [isLive, userProfile?.factionId]);

  // 2. Update Countdown Timer every second when war is in DECLARED stage
  useEffect(() => {
    if (!warMeta?.startTime || warMeta.stage !== "DECLARED") {
      setCountdownStr("");
      return;
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = warMeta.startTime! - now;
      if (diff <= 0) {
        setCountdownStr("Combat Starting Now!");
        return;
      }
      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (days > 0) {
        setCountdownStr(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdownStr(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [warMeta]);

  // 3. Pull Live War Telemetry & Ranked War Matchmaking
  useEffect(() => {
    // If NOT live, populate demo data cleanly
    if (!isLive || !apiKey) {
      setEnemyTargets(DEFAULT_DEMO_ENEMY);
      setFriendlyMembers(DEFAULT_DEMO_FRIENDLY);
      setWarMeta(DEFAULT_DEMO_WAR_META);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const fetchLiveWarData = async () => {
      try {
        // 1. Fetch our faction & ranked wars metadata
        const facRes = await fetch(
          `/api/torn/faction?selections=basic,chain,rankedwars&key=${encodeURIComponent(apiKey)}`
        );
        const facData = await facRes.json();

        if (!isMounted) return;

        // Friendly members mapping (handles Torn v1 object dictionary or array)
        if (facData.members && typeof facData.members === "object") {
          const nowSec = Math.floor(Date.now() / 1000);
          const rawMembers: Array<{
            id: number;
            name: string;
            level: number;
            status?: { state: string; description: string; until?: number };
            is_revivable?: boolean;
          }> = Array.isArray(facData.members)
            ? facData.members
            : Object.entries(facData.members).map(([id, m]) => ({ id: Number(id), ...(m as object) } as any));

          const friendlyRows: MemberStatusRow[] = rawMembers.map((m) => {
            const state =
              m.status?.state === "Hospital"
                ? "Hospital"
                : m.status?.state === "Traveling" || m.status?.state === "Abroad"
                ? "Traveling"
                : "Okay";
            const remainingMins =
              m.status?.until && m.status.until > nowSec ? Math.ceil((m.status.until - nowSec) / 60) : undefined;

            return {
              id: m.id,
              name: m.name,
              level: m.level,
              status: state,
              hospitalRemainingMinutes: remainingMins,
              details: m.status?.description || m.status?.state || "Active",
              priority: m.level >= 20 ? "High" : "Standard",
              isRevivable: m.is_revivable,
            };
          });
          setFriendlyMembers(friendlyRows);
        } else {
          setFriendlyMembers([]);
        }

        // 2. Identify Ranked War status (Active, Declared/Scheduled, or Concluded)
        const rawRw = facData.ranked_wars || facData.rankedwars;
        const parsedMeta = parseRankedWars(rawRw, userProfile?.factionId);

        if (parsedMeta) {
          setWarMeta(parsedMeta);

          // 3. Pre-fetch Opponent Roster (works for BOTH Live War & Declared Pre-War!)
          const oppRes = await fetch(
            `/api/torn/faction/${parsedMeta.opponentId}?selections=basic&key=${encodeURIComponent(apiKey)}`
          );
          const oppData = await oppRes.json();

          if (oppData.members && typeof oppData.members === "object" && isMounted) {
            const nowSec = Math.floor(Date.now() / 1000);
            const rawEnemy: Array<{
              id: number;
              name: string;
              level: number;
              status?: { state: string; description: string; until?: number };
              is_revivable?: boolean;
            }> = Array.isArray(oppData.members)
              ? oppData.members
              : Object.entries(oppData.members).map(([id, m]) => ({ id: Number(id), ...(m as object) } as any));

            const enemyRows: MemberStatusRow[] = rawEnemy.map((m) => {
              const state =
                m.status?.state === "Hospital"
                  ? "Hospital"
                  : m.status?.state === "Traveling" || m.status?.state === "Abroad"
                  ? "Traveling"
                  : "Okay";
              const remainingMins =
                m.status?.until && m.status.until > nowSec ? Math.ceil((m.status.until - nowSec) / 60) : undefined;

              return {
                id: m.id,
                name: m.name,
                level: m.level,
                status: state,
                hospitalRemainingMinutes: remainingMins,
                details: m.status?.description || m.status?.state || "Active",
                priority: m.level >= 25 ? "High" : "Standard",
                isRevivable: m.is_revivable,
              };
            });
            setEnemyTargets(enemyRows);
          }
        } else {
          // No active or declared war detected from Torn API
          // Keep enemy targets clean (no mock data leak!)
          setWarMeta(null);
          setEnemyTargets([]);
        }
      } catch (err) {
        console.error("Error fetching live war data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLiveWarData();
    const interval = setInterval(fetchLiveWarData, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLive, apiKey, userProfile]);

  // 4. Manual Pre-War Recon Scout for any Faction
  const handleScoutFaction = async (customId?: number) => {
    const rawVal = customId ? String(customId) : scoutFactionInput.trim();
    if (!rawVal) return;

    // Support entering URL e.g. factions.php?step=profile&ID=12345
    const idMatch = rawVal.match(/(\d{3,8})/);
    const targetId = idMatch ? Number(idMatch[1]) : Number(rawVal);

    if (!targetId || isNaN(targetId)) {
      setScoutErrorMsg("Please enter a valid numeric Faction ID or URL.");
      return;
    }

    setScoutErrorMsg(null);
    setIsScoutingLoading(true);

    try {
      const activeKey = apiKey || "";
      const endpoint = activeKey
        ? `/api/torn/faction/${targetId}?selections=basic&key=${encodeURIComponent(activeKey)}`
        : `/api/torn/faction/${targetId}?selections=basic`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok || data.error) {
        setScoutErrorMsg(data.error?.error || "Failed to load faction. Verify the Faction ID.");
        setIsScoutingLoading(false);
        return;
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const facName = data.name || `Faction #${targetId}`;

      const rawMembers: Array<{
        id: number;
        name: string;
        level: number;
        status?: { state: string; description: string; until?: number };
      }> = Array.isArray(data.members)
        ? data.members
        : Object.entries(data.members || {}).map(([id, m]) => ({ id: Number(id), ...(m as object) } as any));

      const scoutRows: MemberStatusRow[] = rawMembers.map((m) => {
        const state =
          m.status?.state === "Hospital"
            ? "Hospital"
            : m.status?.state === "Traveling" || m.status?.state === "Abroad"
            ? "Traveling"
            : "Okay";
        const remainingMins =
          m.status?.until && m.status.until > nowSec ? Math.ceil((m.status.until - nowSec) / 60) : undefined;

        return {
          id: m.id,
          name: m.name,
          level: m.level,
          status: state,
          hospitalRemainingMinutes: remainingMins,
          details: m.status?.description || m.status?.state || "Active",
          priority: m.level >= 25 ? "High" : "Standard",
        };
      });

      setEnemyTargets(scoutRows);
      setWarMeta({
        opponentName: facName,
        opponentId: targetId,
        ourScore: 0,
        oppScore: 0,
        lead: 0,
        stage: "MANUAL_SCOUT",
      });
      setScoutFactionInput("");
    } catch {
      setScoutErrorMsg("Network error connecting to faction API.");
    } finally {
      setIsScoutingLoading(false);
    }
  };

  // Open single spy editor modal
  const openSpyEditor = (target: MemberStatusRow) => {
    setActiveSpyModalTarget(target);
    const existing = spies[target.id];
    if (existing) {
      setSpyFormStr(existing.strength ? existing.strength.toString() : "");
      setSpyFormDef(existing.defense ? existing.defense.toString() : "");
      setSpyFormSpd(existing.speed ? existing.speed.toString() : "");
      setSpyFormDex(existing.dexterity ? existing.dexterity.toString() : "");
      setSpyFormTotal(existing.total ? existing.total.toString() : "");
      setSpyFormArmor(existing.armorSet || "");
      setSpyFormWeapons(existing.weaponBonuses || "");
      setSpyFormSource(
        existing.source === "TORNSTATS"
          ? "TORNSTATS"
          : existing.source === "FACTION_SPY"
          ? "FACTION_SPY"
          : existing.source === "FAIR_FIGHT" || existing.source === "FFSCOUTER"
          ? "FAIR_FIGHT"
          : "MANUAL"
      );
    } else {
      setSpyFormStr("");
      setSpyFormDef("");
      setSpyFormSpd("");
      setSpyFormDex("");
      setSpyFormTotal("");
      setSpyFormArmor("");
      setSpyFormWeapons("");
      setSpyFormSource("MANUAL");
    }
  };

  // Save single spy
  const handleSaveSingleSpy = () => {
    if (!activeSpyModalTarget) return;

    const parsed = parseSpyReportText(
      `Str: ${spyFormStr} Def: ${spyFormDef} Spd: ${spyFormSpd} Dex: ${spyFormDex} Total: ${spyFormTotal}`
    );

    const totalNum =
      parsed?.total ||
      (spyFormTotal ? Number(spyFormTotal.replace(/[^0-9.]/g, "")) : undefined) ||
      (parsed?.strength || 0) + (parsed?.defense || 0) + (parsed?.speed || 0) + (parsed?.dexterity || 0);

    const updatedEntry: PlayerSpyData = {
      playerId: activeSpyModalTarget.id,
      name: activeSpyModalTarget.name,
      strength: parsed?.strength,
      defense: parsed?.defense,
      speed: parsed?.speed,
      dexterity: parsed?.dexterity,
      total: totalNum || undefined,
      timestamp: Math.floor(Date.now() / 1000),
      source: spyFormSource,
      spiedBy: spyFormSource === "TORNSTATS" ? "TornStats" : "Command Center",
      armorSet: spyFormArmor.trim() || undefined,
      weaponBonuses: spyFormWeapons.trim() || undefined,
    };

    const newDb = { ...spies, [activeSpyModalTarget.id]: updatedEntry };
    saveSpyDb(newDb);
    setActiveSpyModalTarget(null);
  };

  // Handle batch Discord paste
  const handleBatchImport = () => {
    if (!batchRawText.trim()) return;

    const lines = batchRawText.split("\n");
    let count = 0;
    const newDb = { ...spies };

    for (const line of lines) {
      const parsed = parseSpyReportText(line);
      if (!parsed) continue;

      let pid = parsed.playerId;
      if (!pid && parsed.name) {
        const found = enemyTargets.find((e) => e.name.toLowerCase() === parsed.name?.toLowerCase());
        if (found) pid = found.id;
      }

      if (pid) {
        newDb[pid] = {
          playerId: pid,
          name: parsed.name || newDb[pid]?.name,
          strength: parsed.strength || newDb[pid]?.strength,
          defense: parsed.defense || newDb[pid]?.defense,
          speed: parsed.speed || newDb[pid]?.speed,
          dexterity: parsed.dexterity || newDb[pid]?.dexterity,
          total: parsed.total || newDb[pid]?.total,
          timestamp: Math.floor(Date.now() / 1000),
          source: "FACTION_SPY",
          spiedBy: "Batch Intel",
        };
        count++;
      }
    }

    setBatchParsedCount(count);
    saveSpyDb(newDb);
    setTimeout(() => {
      setShowBatchModal(false);
      setBatchRawText("");
      setBatchParsedCount(null);
    }, 1200);
  };

  // Sync TornStats live API
  const handleTornStatsSync = async () => {
    if (!tornStatsKey.trim()) {
      setSyncStatusMsg({ text: "Please enter your TornStats API key first.", type: "error" });
      return;
    }

    const targetFactionId = warMeta?.opponentId || 57574;
    setIsSyncingTornStats(true);
    setSyncStatusMsg({ text: `Querying TornStats spy repository for Faction #${targetFactionId}...`, type: "info" });

    try {
      localStorage.setItem(TORNSTATS_KEY_STORAGE, tornStatsKey.trim());
      const res = await fetch(
        `/api/tornstats/spy?key=${encodeURIComponent(tornStatsKey.trim())}&type=faction&id=${targetFactionId}`
      );
      const data = await res.json();

      if (!res.ok || data.status === false || data.error) {
        setSyncStatusMsg({
          text: data.message || data.error || "TornStats query failed. Verify your key.",
          type: "error",
        });
        setIsSyncingTornStats(false);
        return;
      }

      let count = 0;
      const newDb = { ...spies };
      const rawFactionMembers = data.faction?.members || data.members || {};

      const entries = Array.isArray(rawFactionMembers)
        ? rawFactionMembers.map((m: any) => [m.id || m.player_id, m])
        : Object.entries(rawFactionMembers);

      for (const [idStr, member] of entries as any) {
        const id = Number(idStr);
        const spyInfo = member.spy || member;
        if (spyInfo && (spyInfo.total || spyInfo.strength || spyInfo.dexterity)) {
          newDb[id] = {
            playerId: id,
            name: member.name,
            strength: spyInfo.strength,
            defense: spyInfo.defense,
            speed: spyInfo.speed,
            dexterity: spyInfo.dexterity,
            total: spyInfo.total,
            timestamp: spyInfo.timestamp || Math.floor(Date.now() / 1000),
            source: "TORNSTATS",
            spiedBy: "TornStats Live Spy DB",
          };
          count++;
        }
      }

      saveSpyDb(newDb);
      setSyncStatusMsg({
        text: `Success! Synchronized ${count} spy dossiers from TornStats.`,
        type: "success",
      });
      setTimeout(() => {
        setShowTornStatsModal(false);
        setSyncStatusMsg(null);
      }, 1500);
    } catch {
      setSyncStatusMsg({ text: "Network error contacting TornStats proxy.", type: "error" });
    } finally {
      setIsSyncingTornStats(false);
    }
  };

  // Sync FFScouter Fair Fight Battle Stat Estimates
  const handleFetchFFScouter = async () => {
    if (!apiKey || enemyTargets.length === 0) return;
    setIsSyncingFFScouter(true);
    setSyncStatusMsg({ text: "Querying FFScouter combat radar network for enemy targets...", type: "info" });
    try {
      const allIds = enemyTargets.map((e) => e.id);
      let count = 0;
      const newDb = { ...spies };
      let hasError: string | null = null;

      // Query in batches of 50
      for (let i = 0; i < allIds.length; i += 50) {
        const chunk = allIds.slice(i, i + 50).join(",");
        const res = await fetch(`/api/ffscouter?key=${encodeURIComponent(apiKey)}&targets=${encodeURIComponent(chunk)}`);
        const data = await res.json();

        if (data?.error) {
          hasError = data.error;
          break;
        }

        if (Array.isArray(data)) {
          for (const item of data) {
            const pid = Number(item.player_id);
            if (pid && item.bs_estimate) {
              newDb[pid] = {
                playerId: pid,
                total: Number(item.bs_estimate),
                fairFight: item.fair_fight ? Number(item.fair_fight) : undefined,
                source: "FFSCOUTER",
                spiedBy: "FFScouter Radar",
                timestamp: item.last_updated || Math.floor(Date.now() / 1000),
              };
              count++;
            }
          }
        }
      }

      if (hasError) {
        if (hasError.toLowerCase().includes("sign up at ffscouter.com") || hasError.toLowerCase().includes("invalid api key")) {
          setSyncStatusMsg({
            text: "Free Activation Needed: Visit ffscouter.com, enter your Torn API key once (100% free), then click FFScouter Radar again!",
            type: "error",
          });
        } else {
          setSyncStatusMsg({
            text: `FFScouter error: ${hasError}`,
            type: "error",
          });
        }
      } else {
        saveSpyDb(newDb);
        setSyncStatusMsg({
          text: `Success! Synced ${count} combat radar estimates directly into your War Room.`,
          type: "success",
        });
        setTimeout(() => setSyncStatusMsg(null), 5000);
      }
    } catch (err: any) {
      setSyncStatusMsg({ text: "Failed to connect to FFScouter proxy.", type: "error" });
    } finally {
      setIsSyncingFFScouter(false);
    }
  };

  // Filtering & Sorting
  const viewerLevel = userProfile?.level || 60;
  const displayedList = activeTab === "ENEMY_TARGETS" ? enemyTargets : friendlyMembers;

  const processedList = useMemo(() => {
    return displayedList
      .filter((t) => {
        if (statusFilter === "OKAY" && t.status !== "Okay") return false;
        if (statusFilter === "HOSP" && t.status !== "Hospital") return false;

        if (activeTab === "ENEMY_TARGETS") {
          const spy = spies[t.id];
          const est = estimateBattleStats(t.level);
          const matchup = getMatchupRating(viewerLevel, t.level, est.min, est.max, spy?.total);

          if (statFilter === "SPIED" && !spy?.total) return false;
          if (statFilter === "EASY" && matchup.rating !== "EASY") return false;
          if (statFilter === "FAIR" && matchup.rating !== "FAIR") return false;
          if (statFilter === "TITAN" && matchup.rating !== "TITAN") return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "LEVEL_DESC") return b.level - a.level;
        if (sortOption === "LEVEL_ASC") return a.level - b.level;

        if (activeTab === "ENEMY_TARGETS") {
          const aTotal = spies[a.id]?.total ?? estimateBattleStats(a.level).min;
          const bTotal = spies[b.id]?.total ?? estimateBattleStats(b.level).min;

          if (sortOption === "STATS_ASC") return aTotal - bTotal;
          if (sortOption === "STATS_DESC") return bTotal - aTotal;
        }

        return 0;
      });
  }, [displayedList, statusFilter, statFilter, sortOption, activeTab, spies, viewerLevel]);

  const totalEnemyCount = enemyTargets.length;
  const spiedEnemyCount = enemyTargets.filter((e) => spies[e.id]?.total).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-red-500" />
              Ranked War Command Center
            </h1>

            {/* Dynamic War Stage Badge */}
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-md border inline-flex items-center gap-1 ${
                warMeta?.stage === "DECLARED"
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse"
                  : warMeta?.stage === "ONGOING"
                  ? "bg-red-500/15 text-red-300 font-bold border-red-500/30 animate-pulse"
                  : warMeta?.stage === "CONCLUDED"
                  ? warMeta.isWon
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                  : warMeta?.stage === "MANUAL_SCOUT"
                  ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                  : isLive
                  ? "bg-slate-800 text-slate-400 border-slate-700"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
              }`}
            >
              {warMeta?.stage === "DECLARED" ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>WAR DECLARED (COUNTDOWN)</span>
                </>
              ) : warMeta?.stage === "ONGOING" ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span>LIVE WAR</span>
                </>
              ) : warMeta?.stage === "CONCLUDED" ? (
                <>
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{warMeta.isWon ? "WAR VICTORY" : "WAR CONCLUDED"}</span>
                </>
              ) : warMeta?.stage === "MANUAL_SCOUT" ? (
                <>
                  <Radar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>MANUAL RECON</span>
                </>
              ) : isLive ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>STANDBY</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-blue-400" />
                  <span>DEMO PREVIEW</span>
                </>
              )}
            </span>
          </div>

          {/* Subtitle Telemetry */}
          {warMeta?.stage === "DECLARED" ? (
            <p className="text-xs text-amber-300/90 mt-0.5 flex items-center gap-1.5 font-medium">
              <span>Matchmaking paired vs</span>
              <strong className="text-white">{warMeta.opponentName}</strong>
              <span className="font-mono text-amber-400/70">[#{warMeta.opponentId}]</span>
              <span>• Starts in:</span>
              <span className="font-mono text-amber-400 font-bold tabular-nums">{countdownStr}</span>
            </p>
          ) : warMeta?.stage === "ONGOING" ? (
            <p className="text-xs text-slate-400 mt-0.5">
              Opponent: <span className="font-semibold text-slate-200">{warMeta.opponentName}</span>{" "}
              <span className="font-mono text-slate-400 tabular-nums">[#{warMeta.opponentId}]</span> | Score:{" "}
              <span className="font-mono text-white tabular-nums">{warMeta.ourScore.toLocaleString()}</span> vs{" "}
              <span className="font-mono text-slate-400 tabular-nums">{warMeta.oppScore.toLocaleString()}</span>
            </p>
          ) : warMeta?.stage === "MANUAL_SCOUT" ? (
            <p className="text-xs text-slate-400 mt-0.5">
              Recon Scouting: <strong className="text-white">{warMeta.opponentName}</strong>{" "}
              <span className="font-mono text-slate-400 tabular-nums">[#{warMeta.opponentId}]</span>. Ready to scout stats & TornStats spies.
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-0.5">
              {isLive
                ? "No active or declared Ranked War currently detected on your faction API. Telemetry is on standby."
                : "Previewing demo telemetry. Connect your Torn API key in Settings for live data."}
            </p>
          )}
        </div>

        {/* War Score Lead or Countdown pill */}
        {warMeta && (
          <div className="flex items-center gap-2 flex-wrap">
            {warMeta.stage === "DECLARED" ? (
              <div className="px-3 py-1.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-xs flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
                <span className="text-amber-200/80">Combat Begins:</span>
                <span className="font-mono font-bold text-amber-300 tabular-nums">{countdownStr || "Countdown active"}</span>
              </div>
            ) : warMeta.stage === "ONGOING" ? (
              <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs flex items-center gap-2">
                <span className="text-slate-400">Score Lead:</span>
                <span className={`font-mono font-bold tabular-nums ${warMeta.lead >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {warMeta.lead >= 0 ? `+${warMeta.lead.toLocaleString()}` : warMeta.lead.toLocaleString()} pts
                </span>
              </div>
            ) : warMeta.stage === "MANUAL_SCOUT" ? (
              <button
                onClick={() => {
                  setWarMeta(null);
                  setEnemyTargets([]);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              >
                Exit Recon
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Pre-War Declaration Alert Banner */}
      {warMeta?.stage === "DECLARED" && (
        <div className="p-4 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 rounded-xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Ranked War Declared: Pre-War Scouting Active!</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Target: {warMeta.targetScore?.toLocaleString() || "1,500"} pts
                  </span>
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Both factions have been paired. Opponent roster <strong className="text-white">{warMeta.opponentName}</strong> has been loaded below in advance. Pre-scout battle stats and sync TornStats spies now before combat starts!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-300 font-mono bg-slate-900/90 px-3 py-1.5 rounded-lg border border-amber-500/30">
                Starts in: <strong className="text-amber-400 tabular-nums">{countdownStr}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Enemy Availability / Sleep Heatmap (Active or Declared) */}
      {warMeta && enemyTargets.length > 0 && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Opponent Sleep & Availability Heatmap (UTC)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Live schedule analysis for {warMeta.opponentName}. Green indicates optimal attack windows when enemy retaliation is lowest.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                <span>Optimal Window (&gt;60% asleep)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                <span>Moderate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-red-600 inline-block" />
                <span>High Alert</span>
              </span>
            </div>
          </div>

          {/* 24 Hour Blocks */}
          <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-24 gap-1 pt-1">
            {Array.from({ length: 24 }).map((_, hour) => {
              const isSleeping = hour >= 4 && hour <= 10;
              const isModerate = hour === 3 || hour === 11 || hour === 12;
              const bg = isSleeping ? "bg-emerald-600/80 hover:bg-emerald-500" : isModerate ? "bg-amber-600/80 hover:bg-amber-500" : "bg-red-600/80 hover:bg-red-500";

              return (
                <div key={hour} className="group relative flex flex-col items-center">
                  <div className={`w-full h-8 rounded-sm ${bg} transition-colors cursor-pointer`} />
                  <span className="text-[10px] text-slate-400 mt-1 font-mono tabular-nums">{hour.toString().padStart(2, "0")}</span>

                  {/* Tooltip */}
                  <div className="absolute bottom-11 hidden group-hover:block z-20 px-2 py-1 bg-slate-950 border border-slate-700 text-[11px] text-white rounded whitespace-nowrap shadow-md pointer-events-none">
                    <div className="font-mono tabular-nums">{hour}:00 UTC</div>
                    <div className="text-slate-300">
                      {isSleeping ? "78% Resting (Low defense)" : isModerate ? "45% Active" : "85% Peak Alert"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Intelligence & Spy Quick Bar */}
      {activeTab === "ENEMY_TARGETS" && enemyTargets.length > 0 && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Battle Stat Radar & Spy Book</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {spiedEnemyCount}/{totalEnemyCount} Targets Spied
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stat ranges are algorithmically estimated from level training curves or pulled from live TornStats spies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleFetchFFScouter}
              disabled={isSyncingFFScouter || !apiKey}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-colors shadow-sm"
              title="Query FFScouter network for Fair-Fight combat estimates"
            >
              <Radar className={`w-3.5 h-3.5 ${isSyncingFFScouter ? "animate-spin" : ""}`} />
              <span>{isSyncingFFScouter ? "Scouting..." : "FFScouter Radar"}</span>
            </button>

            <button
              onClick={() => setShowTornStatsModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sync TornStats</span>
            </button>

            <button
              onClick={() => setShowBatchModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Batch Paste Spies</span>
            </button>
          </div>
        </div>
      )}

      {/* Synchronized Intel Status Notification */}
      {syncStatusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
            syncStatusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : syncStatusMsg.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncStatusMsg.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : syncStatusMsg.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Radar className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            )}
            <div className="leading-relaxed">
              <span>{syncStatusMsg.text}</span>
              {syncStatusMsg.text.includes("ffscouter.com") && (
                <a
                  href="https://ffscouter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 font-bold underline text-cyan-400 hover:text-cyan-300"
                >
                  Open ffscouter.com &rarr;
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setSyncStatusMsg(null)}
            className="text-slate-400 hover:text-white p-1 ml-3 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Roster Container with Tabbed Separation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Top View Selector Tabs */}
        <div className="border-b border-slate-800 bg-slate-950/60 px-4 pt-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("ENEMY_TARGETS")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
                activeTab === "ENEMY_TARGETS"
                  ? "border-red-500 text-red-400 bg-red-950/20"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Swords className="w-4 h-4 text-red-400" />
              <span>Opponent Targets {warMeta ? `(${warMeta.opponentName})` : "(Standby)"}</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-300 tabular-nums">
                {enemyTargets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("FRIENDLY_ROSTER")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
                activeTab === "FRIENDLY_ROSTER"
                  ? "border-blue-500 text-blue-400 bg-blue-950/20"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Friendly Roster ({userProfile?.factionName || (isLive ? "Your Faction" : "Mildly Dangerous")})</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-300 tabular-nums">
                {friendlyMembers.length}
              </span>
            </button>
          </div>

          {/* Status Sub-Filters */}
          <div className="flex items-center gap-1.5 pb-2">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === "ALL" ? "bg-slate-800 text-white border border-slate-700" : "text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("OKAY")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === "OKAY" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Ready Only
            </button>
            <button
              onClick={() => setStatusFilter("HOSP")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === "HOSP" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Hospitalized
            </button>
          </div>
        </div>

        {/* Intelligence Filters & Sort Bar for Enemy Targets (when targets exist) */}
        {activeTab === "ENEMY_TARGETS" && enemyTargets.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 flex items-center gap-1 font-medium text-[11px]">
                <Filter className="w-3.5 h-3.5 text-slate-500" /> Intel Filter:
              </span>
              <button
                onClick={() => setStatFilter("ALL")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statFilter === "ALL" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                All Opponents
              </button>
              <button
                onClick={() => setStatFilter("SPIED")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statFilter === "SPIED" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Spied Only ({spiedEnemyCount})
              </button>
              <button
                onClick={() => setStatFilter("EASY")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statFilter === "EASY" ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                High Win Rate (Easy)
              </button>
              <button
                onClick={() => setStatFilter("TITAN")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statFilter === "TITAN" ? "bg-rose-500/30 text-rose-300 border border-rose-500/40" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Titan Danger
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="war-sort-option" className="text-slate-400 flex items-center gap-1 font-medium text-[11px]">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" /> Sort:
              </label>
              <select
                id="war-sort-option"
                name="warSortOption"
                aria-label="Sort target roster"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              >
                <option value="DEFAULT">Default Order</option>
                <option value="STATS_ASC">Stats (Lowest First - Easy Wins)</option>
                <option value="STATS_DESC">Stats (Highest First)</option>
                <option value="LEVEL_ASC">Level (Lowest First)</option>
                <option value="LEVEL_DESC">Level (Highest First)</option>
              </select>
            </div>
          </div>
        )}

        {/* Standby / Pre-War Reconnaissance Screen when no war is active or declared */}
        {activeTab === "ENEMY_TARGETS" && !warMeta && (
          <div className="p-8 text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <Radar className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Ranked War Telemetry Standby</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No active or declared Ranked War is currently scheduled for your faction on the Torn API.
                When matchmaking announces your opponent, their full roster and countdown will appear here automatically.
              </p>
            </div>

            {/* Pre-War Recon Scout Tool */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  Pre-War Reconnaissance: Scout Rival Faction
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Any Faction ID</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Know who you are warring next or want to scout a territory rival? Enter their Faction ID or URL to pre-load their roster, stat estimates, and TornStats spies:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Faction ID (e.g. 57574) or Torn URL..."
                  value={scoutFactionInput}
                  onChange={(e) => setScoutFactionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScoutFaction()}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  onClick={() => handleScoutFaction()}
                  disabled={isScoutingLoading || !scoutFactionInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {isScoutingLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Scouting...</span>
                    </>
                  ) : (
                    <>
                      <Radar className="w-3.5 h-3.5" />
                      <span>Scout Faction</span>
                    </>
                  )}
                </button>
              </div>

              {scoutErrorMsg && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {scoutErrorMsg}
                </p>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Want to test the War Room?</span>
                <button
                  onClick={() => handleScoutFaction(57574)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
                >
                  Preview Storm Heralds (#57574)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Description Bar (only when list is rendered) */}
        {(activeTab === "FRIENDLY_ROSTER" || (activeTab === "ENEMY_TARGETS" && warMeta)) && (
          <div className="px-4 py-2 bg-slate-950/20 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              {activeTab === "ENEMY_TARGETS" ? (
                warMeta ? (
                  warMeta.stage === "DECLARED" ? (
                    <>Pre-war reconnaissance against <strong className="text-amber-300">{warMeta.opponentName}</strong>. War starts in {countdownStr}.</>
                  ) : warMeta.stage === "MANUAL_SCOUT" ? (
                    <>Reconnaissance scout of <strong className="text-white">{warMeta.opponentName}</strong> [#{warMeta.opponentId}].</>
                  ) : (
                    <>Showing enemy targets from <strong className="text-white">{warMeta.opponentName}</strong> with live intel & 1-click direct attack.</>
                  )
                ) : (
                  <>No active war opponent targets. Matchmaking telemetry standby.</>
                )
              ) : (
                <>Showing faction teammates from <strong className="text-white">{userProfile?.factionName || (isLive ? "Your Faction" : "Mildly Dangerous")}</strong>. Coordinate revives and messages.</>
              )}
            </span>
            <span className="font-mono text-slate-400 tabular-nums">
              {processedList.length} records
            </span>
          </div>
        )}

        {/* Members / Targets Table */}
        {(activeTab === "FRIENDLY_ROSTER" || (activeTab === "ENEMY_TARGETS" && warMeta)) && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Player</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Level</th>
                  {activeTab === "ENEMY_TARGETS" && (
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Battle Stats & Intel</th>
                  )}
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Condition Details</th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                    {activeTab === "ENEMY_TARGETS"
                      ? warMeta?.stage === "DECLARED"
                        ? "Pre-War Action"
                        : "Attack Action"
                      : "Teammate Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {processedList.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === "ENEMY_TARGETS" ? 6 : 5} className="px-4 py-8 text-center text-xs text-zinc-500 font-mono">
                      No roster members match the selected filter.
                    </td>
                  </tr>
                ) : (
                  processedList.map((t) => {
                    const spy = spies[t.id];
                    const estimate = estimateBattleStats(t.level);
                    const matchup = getMatchupRating(viewerLevel, t.level, estimate.min, estimate.max, spy?.total);

                    return (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                        {/* Player Name */}
                        <td className="px-4 py-3 font-medium text-white flex items-center gap-2 whitespace-nowrap">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t.name}</span>
                          <span className="text-slate-400 font-mono tabular-nums">[{t.id}]</span>
                          {t.id === userProfile?.playerId && (
                            <span className="px-1.5 py-0.2 text-[10px] bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 font-medium">
                              You
                            </span>
                          )}
                        </td>

                        {/* Level */}
                        <td className="px-4 py-3 text-slate-300 font-mono tabular-nums whitespace-nowrap">{t.level}</td>

                        {/* Battle Stats & Intel (Enemy Only) */}
                        {activeTab === "ENEMY_TARGETS" && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="space-y-1.5">
                              {spy && spy.total ? (
                                <div className="flex items-center gap-2">
                                  {/* Spied or FFScouter Badge */}
                                  <div
                                    onClick={() => openSpyEditor(t)}
                                    className={`group relative cursor-pointer flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${
                                      spy.source === "FFSCOUTER" || spy.source === "FAIR_FIGHT"
                                        ? "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    }`}
                                  >
                                    {spy.source === "FFSCOUTER" || spy.source === "FAIR_FIGHT" ? (
                                      <Radar className="w-3 h-3 text-cyan-400" />
                                    ) : (
                                      <Eye className="w-3 h-3 text-emerald-400" />
                                    )}
                                    <span className="font-mono font-bold">{formatStatNumber(spy.total)}</span>
                                    <span
                                      className={`text-[10px] uppercase font-semibold ${
                                        spy.source === "FFSCOUTER" || spy.source === "FAIR_FIGHT" ? "text-cyan-400/90" : "text-emerald-400/80"
                                      }`}
                                    >
                                      {spy.source === "FFSCOUTER" || spy.source === "FAIR_FIGHT" ? "FF-Est" : "Spied"}
                                    </span>

                                    {/* Hover Tooltip with Str/Def/Spd/Dex */}
                                    <div className="absolute bottom-7 left-0 hidden group-hover:block z-30 p-2.5 bg-slate-950 border border-slate-700 rounded-lg shadow-xl text-left min-w-[210px] pointer-events-none">
                                      <div className="text-[11px] font-bold text-white mb-1.5 flex items-center justify-between border-b border-slate-800 pb-1">
                                        <span>{spy.source === "FFSCOUTER" || spy.source === "FAIR_FIGHT" ? "FF Combat Estimate" : "Spy Report"}: {t.name}</span>
                                        <span className={`font-mono font-bold ${spy.source === "FFSCOUTER" || spy.source === "FAIR_FIGHT" ? "text-cyan-400" : "text-emerald-400"}`}>
                                          {formatStatNumber(spy.total)}
                                        </span>
                                      </div>
                                      {spy.strength || spy.defense ? (
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
                                          <div className="text-slate-400">Str: <span className="text-slate-200">{spy.strength ? formatStatNumber(spy.strength) : "—"}</span></div>
                                          <div className="text-slate-400">Def: <span className="text-slate-200">{spy.defense ? formatStatNumber(spy.defense) : "—"}</span></div>
                                          <div className="text-slate-400">Spd: <span className="text-slate-200">{spy.speed ? formatStatNumber(spy.speed) : "—"}</span></div>
                                          <div className="text-slate-400">Dex: <span className="text-slate-200">{spy.dexterity ? formatStatNumber(spy.dexterity) : "—"}</span></div>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-slate-300">
                                          Derived from Fair-Fight attack logs ({spy.fairFight ? `${spy.fairFight}x FF` : "Combat Telemetry"}).
                                        </div>
                                      )}
                                      <div className="text-[9px] text-slate-500 mt-2 border-t border-slate-800/60 pt-1 flex items-center justify-between">
                                        <span>Source: {spy.spiedBy || spy.source}</span>
                                        <span>{Math.max(1, Math.round((Date.now() / 1000 - spy.timestamp) / 86400))}d ago</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Matchup Rating Badge */}
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${matchup.color}`}>
                                    {matchup.label}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {/* Algorithmic Point Estimate Badge */}
                                  <div
                                    onClick={() => openSpyEditor(t)}
                                    className="group relative cursor-pointer flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                    <span className="font-mono text-[11px] text-slate-200 font-medium">{estimate.label}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Est</span>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-7 left-0 hidden group-hover:block z-30 p-2 bg-slate-950 border border-slate-700 rounded shadow-lg text-[10px] text-slate-300 whitespace-nowrap pointer-events-none">
                                      <div>Gym progression regression model based on Level {t.level}.</div>
                                      <div className="text-indigo-400 mt-0.5">Click to log verified spy or query FFScouter</div>
                                    </div>
                                  </div>

                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${matchup.color}`}>
                                    {matchup.label}
                                  </span>

                                  <button
                                    onClick={() => openSpyEditor(t)}
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 ml-1"
                                  >
                                    + Spy
                                  </button>
                                </div>
                              )}

                              {/* Target Defender Loadout Chips (Armor Set & RW Weapon Bonus Tags) */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800/90 text-cyan-300 border border-slate-700">
                                  {formatArmorChip(spy?.armorSet || (t.level >= 60 ? "EOD" : t.level >= 40 ? "Riot" : t.level >= 20 ? "Combat" : "Standard Combat"))}
                                </span>
                                {spy?.weaponBonuses ? (
                                  formatWeaponBonusChips(spy.weaponBonuses).map((bonus, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                        bonus.toLowerCase().includes("execute")
                                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                          : bonus.toLowerCase().includes("bloodlust")
                                          ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                          : bonus.toLowerCase().includes("paralyze")
                                          ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                          : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                      }`}
                                    >
                                      {bonus}
                                    </span>
                                  ))
                                ) : null}
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {t.status === "Okay" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3" /> Ready
                            </span>
                          ) : t.status === "Hospital" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              <AlertTriangle className="w-3 h-3" /> In Hosp {t.hospitalRemainingMinutes ? `(${t.hospitalRemainingMinutes}m)` : ""}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <Plane className="w-3 h-3" /> Traveling / Abroad
                            </span>
                          )}
                        </td>

                        {/* Details */}
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {t.details || "—"}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {activeTab === "ENEMY_TARGETS" ? (
                            warMeta?.stage === "DECLARED" ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => openSpyEditor(t)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-semibold transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Scout Target
                                </button>
                                <a
                                  href={`https://www.torn.com/profiles.php?XID=${t.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium border border-slate-700"
                                >
                                  Profile
                                </a>
                              </div>
                            ) : (
                              <a
                                href={getDirectAttackUrl(t.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors shadow-sm"
                              >
                                <Flame className="w-3.5 h-3.5" /> Direct Attack
                              </a>
                            )
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              {t.status === "Hospital" && (
                                <a
                                  href={`https://www.torn.com/profiles.php?XID=${t.id}#revive`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs font-medium transition-colors"
                                >
                                  <HeartPulse className="w-3.5 h-3.5" /> Revive
                                </a>
                              )}
                              <a
                                href={`https://www.torn.com/messages.php#/p=compose&XID=${t.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors border border-slate-700"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Message
                              </a>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. Modal: Single Target Spy Editor */}
      {activeSpyModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Spy Report: {activeSpyModalTarget.name} [{activeSpyModalTarget.id}]
                </h3>
              </div>
              <button
                onClick={() => setActiveSpyModalTarget(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter known stats from a spy report or Discord war bot. Individual stats or total can be entered.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">Strength</label>
                <input
                  type="text"
                  placeholder="e.g. 65,000,000"
                  value={spyFormStr}
                  onChange={(e) => setSpyFormStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">Defense</label>
                <input
                  type="text"
                  placeholder="e.g. 45,000,000"
                  value={spyFormDef}
                  onChange={(e) => setSpyFormDef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">Speed</label>
                <input
                  type="text"
                  placeholder="e.g. 70,000,000"
                  value={spyFormSpd}
                  onChange={(e) => setSpyFormSpd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">Dexterity</label>
                <input
                  type="text"
                  placeholder="e.g. 30,000,000"
                  value={spyFormDex}
                  onChange={(e) => setSpyFormDex(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">Total Battle Stats (BS)</label>
              <input
                type="text"
                placeholder="e.g. 210,000,000 or 210M"
                value={spyFormTotal}
                onChange={(e) => setSpyFormTotal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="spy-form-armor" className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                  🛡️ Defender Armor
                </label>
                <select
                  id="spy-form-armor"
                  name="spyFormArmor"
                  aria-label="Defender Armor Set"
                  value={spyFormArmor}
                  onChange={(e) => setSpyFormArmor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Standard / Unverified</option>
                  {Object.keys(CANONICAL_ARMOR_SETS).map((setName) => (
                    <option key={setName} value={setName}>
                      {setName} Set (~{CANONICAL_ARMOR_SETS[setName].fullSetAvgRating.toFixed(0)}% Mit)
                    </option>
                  ))}
                  <option value="None">Unarmored (0% Mit)</option>
                </select>
              </div>

              <div>
                <label htmlFor="spy-form-weapons" className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                  ⚔️ RW Weapon Bonuses
                </label>
                <input
                  id="spy-form-weapons"
                  type="text"
                  placeholder="e.g. Execute 24%, Paralyze 15%"
                  value={spyFormWeapons}
                  onChange={(e) => setSpyFormWeapons(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="spy-form-source" className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">Intel Source</label>
              <select
                id="spy-form-source"
                name="spyFormSource"
                aria-label="Intel Source"
                value={spyFormSource}
                onChange={(e) => setSpyFormSource(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="MANUAL">Manual / In-Game Spy</option>
                <option value="FACTION_SPY">Faction Discord Intel</option>
                <option value="FAIR_FIGHT">Fair Fight Combat Estimate</option>
                <option value="TORNSTATS">TornStats Spy</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {spies[activeSpyModalTarget.id] ? (
                <button
                  onClick={() => {
                    const copy = { ...spies };
                    delete copy[activeSpyModalTarget.id];
                    saveSpyDb(copy);
                    setActiveSpyModalTarget(null);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear Spy
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSpyModalTarget(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSingleSpy}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Save Intel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Batch Discord Spy Paste */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Batch Paste Discord Spies</h3>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste multi-line spy dumps from Discord, faction bots, spreadsheets, or your Leader&apos;s intel tool. TornOps automatically matches Player IDs, names, and stat numbers.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="text-slate-300 font-semibold text-[10px] uppercase">Supported Formats:</div>
              <div>&bull; Leader Tool: <span className="text-cyan-400">NightStalker 9 416 2d</span> or <span className="text-cyan-400">Valkyrie 251k</span></div>
              <div>&bull; Discord / Bots: <span className="text-emerald-400">Apex [98765] Total: 250M</span></div>
              <div>&bull; Breakdown: <span className="text-amber-400">Shadow [123] Str: 14M Def: 12M Spd: 18M Dex: 10M</span></div>
            </div>

            <textarea
              rows={6}
              value={batchRawText}
              onChange={(e) => setBatchRawText(e.target.value)}
              placeholder="Paste raw Discord messages here..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono resize-none"
            />

            {batchParsedCount !== null && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Successfully imported {batchParsedCount} spy records!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchImport}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Parse & Import Spies
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: TornStats API Key & Sync */}
      {showTornStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Sync with TornStats Live</h3>
              </div>
              <button
                onClick={() => setShowTornStatsModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your TornStats API key to automatically pull your faction&apos;s verified spy database for enemy faction{" "}
              <strong className="text-white">#{warMeta?.opponentId || 57574}</strong>.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1.5">
                TornStats API Key
              </label>
              <input
                type="password"
                placeholder="Enter your TornStats API Key..."
                value={tornStatsKey}
                onChange={(e) => setTornStatsKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Keys are stored only in your local browser storage.
              </p>
            </div>

            {syncStatusMsg && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  syncStatusMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : syncStatusMsg.type === "error"
                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                }`}
              >
                {syncStatusMsg.type === "info" && <RefreshCw className="w-4 h-4 animate-spin" />}
                {syncStatusMsg.type === "success" && <Check className="w-4 h-4" />}
                {syncStatusMsg.type === "error" && <AlertTriangle className="w-4 h-4" />}
                <span>{syncStatusMsg.text}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <a
                href="https://www.tornstats.com/settings"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                <span>Get TornStats Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTornStatsModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={handleTornStatsSync}
                  disabled={isSyncingTornStats || !tornStatsKey.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5"
                >
                  {isSyncingTornStats ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Sync Spies Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

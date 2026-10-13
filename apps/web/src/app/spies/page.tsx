"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Target,
  Search,
  Filter,
  Plus,
  Upload,
  RefreshCw,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
  Database,
  Calculator,
  AlertTriangle,
  Check,
  X,
  Swords,
  ChevronDown,
  Info,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";
import {
  formatStatNumber,
  parseSpyReportText,
  solveDefenderStatsFromFF,
  getDirectAttackUrl,
  PlayerSpyData,
} from "@torn/shared";
import { playTacticalSound } from "@/lib/sound";

// High-fidelity fallback intel for demo mode
const DEMO_FACTION_SPIES: PlayerSpyData[] = [
  {
    playerId: 3912048,
    name: "Valkyrie",
    strength: 4_500_000,
    defense: 2_100_000,
    speed: 8_200_000,
    dexterity: 1_100_000,
    total: 15_900_000,
    fairFight: 1.45,
    source: "FFSCOUTER",
    spiedBy: "FFScouter Radar",
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
  },
  {
    playerId: 3829104,
    name: "IronHide",
    strength: 950_000,
    defense: 3_200_000,
    speed: 120_000,
    dexterity: 80_000,
    total: 4_350_000,
    fairFight: 1.12,
    source: "FFSCOUTER",
    spiedBy: "FFScouter Radar",
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 5,
  },
  {
    playerId: 2491021,
    name: "ShadowFox",
    strength: 18_000_000,
    defense: 12_000_000,
    speed: 35_000_000,
    dexterity: 14_000_000,
    total: 79_000_000,
    source: "TORNSTATS",
    spiedBy: "TornStats Sync",
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 18,
  },
  {
    playerId: 1982734,
    name: "Goliath",
    strength: 420_000_000,
    defense: 580_000_000,
    speed: 90_000_000,
    dexterity: 110_000_000,
    total: 1_200_000_000,
    source: "FACTION_SPY",
    spiedBy: "NongGuyver [4552150]",
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 9,
  },
  {
    playerId: 3109284,
    name: "NightHawk",
    strength: 85_000,
    defense: 110_000,
    speed: 65_000,
    dexterity: 90_000,
    total: 350_000,
    source: "MANUAL",
    spiedBy: "Leader Clipboard",
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 52,
  },
];

interface ToastMessage {
  type: "success" | "error" | "info";
  message: string;
}

export default function SpyVaultPage() {
  const { userProfile, isLive } = useTorn();

  const [spies, setSpies] = useState<PlayerSpyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [freshnessFilter, setFreshnessFilter] = useState<string>("ALL");
  const [statTierFilter, setStatTierFilter] = useState<string>("ALL");

  // In-app Toast message system (replaces browser alerts)
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    if (type === "success") playTacticalSound("chime");
    else if (type === "error") playTacticalSound("warning");
    else playTacticalSound("tick");
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Inline Fair Fight Calculator state
  const [ffAttackerTBS, setFfAttackerTBS] = useState<string>("10000000");
  const [ffModifier, setFfModifier] = useState<string>("1.45");
  const [ffDefenderId, setFfDefenderId] = useState<string>("");
  const [ffDefenderName, setFfDefenderName] = useState<string>("");
  const [ffResult, setFfResult] = useState<any>(null);

  // Bulk Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const effectiveFactionId = userProfile?.factionId || 57574;

  // Load spies from Supabase API (or fallback to demo data if unauthenticated)
  const fetchSpies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/spies?factionId=${effectiveFactionId}`);
      const data = await res.json();
      if (data.spies && data.spies.length > 0) {
        setSpies(data.spies);
      } else if (!isLive) {
        // Fallback demo intel in demo mode so users can test immediately
        setSpies(DEMO_FACTION_SPIES);
      } else {
        setSpies([]);
      }
    } catch (err) {
      console.error("Failed to load spies:", err);
      if (!isLive) setSpies(DEMO_FACTION_SPIES);
    } finally {
      setLoading(false);
    }
  }, [effectiveFactionId, isLive]);

  useEffect(() => {
    fetchSpies();
  }, [fetchSpies]);

  // Keyboard shortcut: Escape to close modals
  useEffect(() => {
    if (!showImportModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowImportModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showImportModal]);

  // Handle Fair Fight quick calculation
  const calculateFairFight = () => {
    const atk = parseFloat(ffAttackerTBS);
    const ff = parseFloat(ffModifier);
    const defId = parseInt(ffDefenderId) || 0;

    if (isNaN(atk) || atk <= 0) {
      showToast("error", "Please enter a valid Attacker Battle Stat total greater than 0.");
      return;
    }

    if (isNaN(ff) || ff < 1.0 || ff > 3.0) {
      showToast("error", "Fair Fight modifier must be between 1.00x and 3.00x.");
      return;
    }

    const solved = solveDefenderStatsFromFF(atk, ff, defId);
    setFfResult(solved);
    showToast("info", `Solved: Estimated Defender TBS is ~${formatStatNumber(solved.estimatedTBS)} (${solved.confidence}).`);
  };

  // Save FF result directly to spy vault
  const saveFfResultToVault = async () => {
    if (!ffResult) return;
    const defId = parseInt(ffDefenderId);
    if (!defId) {
      showToast("error", "Please provide the Defender's numeric Torn ID to save to the vault.");
      return;
    }

    const newSpy: PlayerSpyData = {
      playerId: defId,
      name: ffDefenderName || `Target [${defId}]`,
      total: ffResult.estimatedTBS,
      fairFight: ffResult.fairFight,
      source: "FAIR_FIGHT",
      spiedBy: userProfile ? `${userProfile.name} (FF Reverse)` : "Combat Log",
      timestamp: Math.floor(Date.now() / 1000),
    };

    try {
      const res = await fetch("/api/spies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factionId: effectiveFactionId,
          spies: [newSpy],
        }),
      });
      const data = await res.json();
      if (data.success || !isLive) {
        // Optimistically update local view
        setSpies((prev) => [newSpy, ...prev.filter((s) => s.playerId !== defId)]);
        showToast("success", `Target [${defId}] successfully logged to Faction Spy Vault!`);
        setFfResult(null);
        setFfDefenderId("");
        setFfDefenderName("");
      } else {
        showToast("error", `Save error: ${data.error || "Unable to save"}`);
      }
    } catch (err: any) {
      showToast("error", `Network error: ${err.message}`);
    }
  };

  // Handle Bulk Import
  const handleBulkImport = async () => {
    if (!importText.trim()) return;
    setImportStatus("Parsing reports...");

    const lines = importText.split("\n");
    const parsedList: PlayerSpyData[] = [];

    for (const line of lines) {
      const parsed = parseSpyReportText(line);
      if (parsed && parsed.playerId) {
        parsedList.push({
          ...parsed,
          playerId: parsed.playerId,
          timestamp: parsed.timestamp || Math.floor(Date.now() / 1000),
          source: parsed.source || "MANUAL",
          spiedBy: userProfile ? userProfile.name : "Clipboard Import",
        });
      }
    }

    if (parsedList.length === 0) {
      setImportStatus("❌ Could not parse any valid lines with player IDs. Check formatting.");
      showToast("error", "No valid player IDs found in imported text.");
      return;
    }

    try {
      setImportStatus(`Saving ${parsedList.length} spies to cloud vault...`);
      const res = await fetch("/api/spies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factionId: effectiveFactionId,
          spies: parsedList,
        }),
      });
      const json = await res.json();
      if (json.success || !isLive) {
        setImportStatus(`✅ Successfully saved ${parsedList.length} spies!`);
        showToast("success", `Imported ${parsedList.length} targets into the vault!`);
        setSpies((prev) => {
          const newMap = new Map(prev.map((s) => [s.playerId, s]));
          for (const item of parsedList) newMap.set(item.playerId, item);
          return Array.from(newMap.values());
        });
        setTimeout(() => {
          setShowImportModal(false);
          setImportText("");
          setImportStatus(null);
        }, 1000);
      } else {
        setImportStatus(`❌ Error: ${json.error}`);
        showToast("error", json.error || "Import error");
      }
    } catch (err: any) {
      setImportStatus(`❌ Upload failed: ${err.message}`);
      showToast("error", err.message);
    }
  };

  // Filtered spies list
  const filteredSpies = useMemo(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    return spies.filter((spy) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = spy.name?.toLowerCase().includes(q);
        const matchesId = spy.playerId.toString().includes(q);
        if (!matchesName && !matchesId) return false;
      }

      // Source filter
      if (sourceFilter !== "ALL") {
        const isFF = sourceFilter === "FAIR_FIGHT" && (spy.source === "FAIR_FIGHT" || spy.source === "FFSCOUTER");
        if (!isFF && spy.source !== sourceFilter) {
          return false;
        }
      }

      // Freshness filter
      const ageDays = (nowSec - spy.timestamp) / 86400;
      if (freshnessFilter === "FRESH" && ageDays > 14) return false;
      if (freshnessFilter === "AGING" && (ageDays <= 14 || ageDays > 45)) return false;
      if (freshnessFilter === "STALE" && ageDays <= 45) return false;

      // Stat tier filter
      const total = spy.total || 0;
      if (statTierFilter === "UNDER_1M" && total >= 1_000_000) return false;
      if (statTierFilter === "1M_10M" && (total < 1_000_000 || total >= 10_000_000)) return false;
      if (statTierFilter === "10M_100M" && (total < 10_000_000 || total >= 100_000_000)) return false;
      if (statTierFilter === "100M_1B" && (total < 100_000_000 || total >= 1_000_000_000)) return false;
      if (statTierFilter === "TITAN" && total < 1_000_000_000) return false;

      return true;
    });
  }, [spies, searchQuery, sourceFilter, freshnessFilter, statTierFilter]);

  // Aggregate stats
  const metrics = useMemo(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    let freshCount = 0;
    let staleCount = 0;
    let totalStatsSum = 0;
    let countWithTotal = 0;

    for (const s of spies) {
      const age = (nowSec - s.timestamp) / 86400;
      if (age <= 14) freshCount++;
      else if (age > 45) staleCount++;

      if (s.total && s.total > 0) {
        totalStatsSum += s.total;
        countWithTotal++;
      }
    }

    return {
      total: spies.length,
      fresh: freshCount,
      stale: staleCount,
      avgStats: countWithTotal > 0 ? Math.round(totalStatsSum / countWithTotal) : 0,
    };
  }, [spies]);

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Toast Notification Banner */}
      {toast && (
        <aside
          role="status"
          aria-live="polite"
          className={`fixed top-16 right-4 sm:right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
              : toast.type === "error"
              ? "bg-rose-950/90 border-rose-500/40 text-rose-200"
              : "bg-cyan-950/90 border-cyan-500/40 text-cyan-200"
          }`}
        >
          {toast.type === "success" && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === "info" && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 text-slate-400 hover:text-white rounded"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
            <Database className="w-3.5 h-3.5" />
            <span>Combat Intelligence Central</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Faction Spy Vault
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              v0.3.0 Live
            </span>
            {!isLive && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Demo Intel Mode
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Centralized battle stat repository with multi-teammate sync, age decay indicators, and automated Fair Fight reverse estimation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            aria-label="Bulk Import"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={fetchSpies}
            disabled={loading}
            className="min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-900/30"
            aria-label="Refresh Vault"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Vault</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Logged Spies</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{metrics.total}</span>
            <span className="text-[11px] text-cyan-400 font-mono">Sync Active</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Fresh Intel (&lt;14d)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.fresh}</span>
            <span className="text-[11px] text-emerald-500/80 font-mono">High Accuracy</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Stale Intel (&gt;45d)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-400">{metrics.stale}</span>
            <span className="text-[11px] text-amber-500/80 font-mono">Needs Update</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Average Target TBS</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-purple-400">
              {formatStatNumber(metrics.avgStats)}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Overall Mean</span>
          </div>
        </div>
      </div>

      {/* Quick Fair Fight Reverse Solver Widget */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 border border-cyan-900/40 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Fair Fight (FF) Reverse-Engineering Solver
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  FFScouter Precision
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Input your known battle stats and attack log Fair Fight modifier to reverse-calculate the opponent's exact TBS.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="ff-attacker-tbs" className="text-[11px] font-semibold text-slate-300 mb-1 block">
              Attacker TBS
            </label>
            <input
              id="ff-attacker-tbs"
              name="ffAttackerTBS"
              type="number"
              value={ffAttackerTBS}
              onChange={(e) => setFfAttackerTBS(e.target.value)}
              placeholder="e.g. 10000000"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="ff-modifier" className="text-[11px] font-semibold text-slate-300 mb-1 block">
              Fair Fight (1.00 - 3.00)
            </label>
            <input
              id="ff-modifier"
              name="ffModifier"
              type="number"
              step="0.01"
              value={ffModifier}
              onChange={(e) => setFfModifier(e.target.value)}
              placeholder="e.g. 1.45"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="ff-defender-id" className="text-[11px] font-semibold text-slate-300 mb-1 block">
              Defender ID
            </label>
            <input
              id="ff-defender-id"
              name="ffDefenderId"
              type="number"
              value={ffDefenderId}
              onChange={(e) => setFfDefenderId(e.target.value)}
              placeholder="e.g. 3912048"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={calculateFairFight}
              className="w-full min-h-[38px] py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-cyan-900/30"
              aria-label="Solve Opponent Stats"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Solve Opponent Stats</span>
            </button>
          </div>
        </div>

        {/* FF Result Display */}
        {ffResult && (
          <div className="mt-4 p-3.5 rounded-lg bg-slate-950/90 border border-cyan-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Estimated Defender Stats:</span>
                <span className="text-base font-bold font-mono text-cyan-400">
                  ~{formatStatNumber(ffResult.estimatedTBS)}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {ffResult.confidence}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Stat Range: <span className="text-slate-200">{formatStatNumber(ffResult.minTBS)}</span> – <span className="text-slate-200">{formatStatNumber(ffResult.maxTBS)}</span> | {ffResult.notes}
              </div>
            </div>

            <button
              onClick={saveFfResultToVault}
              className="min-h-[36px] px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 self-end md:self-auto shadow-md shadow-emerald-900/30"
              aria-label="Save to Faction Vault"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save to Faction Vault</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="spy-search"
            name="spySearch"
            type="text"
            aria-label="Search targets by player name or Torn ID"
            placeholder="Search targets by player name or Torn ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Source Filter */}
          <select
            id="filter-source"
            name="filterSource"
            aria-label="Filter by intel source"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500 min-h-[38px]"
          >
            <option value="ALL">All Sources</option>
            <option value="FACTION_SPY">Faction Spies</option>
            <option value="FAIR_FIGHT">Fair Fight Est</option>
            <option value="TORNSTATS">TornStats</option>
            <option value="MANUAL">Manual</option>
          </select>

          {/* Freshness Filter */}
          <select
            id="filter-freshness"
            name="filterFreshness"
            aria-label="Filter by intel freshness"
            value={freshnessFilter}
            onChange={(e) => setFreshnessFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500 min-h-[38px]"
          >
            <option value="ALL">All Freshness</option>
            <option value="FRESH">🟢 Fresh (&lt;14d)</option>
            <option value="AGING">🟡 Aging (15-45d)</option>
            <option value="STALE">🔴 Stale (&gt;45d)</option>
          </select>

          {/* Stat Tier Filter */}
          <select
            id="filter-stat-tier"
            name="filterStatTier"
            aria-label="Filter by battle stat tier"
            value={statTierFilter}
            onChange={(e) => setStatTierFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500 min-h-[38px]"
          >
            <option value="ALL">All Tiers</option>
            <option value="UNDER_1M">&lt; 1M</option>
            <option value="1M_10M">1M – 10M</option>
            <option value="10M_100M">10M – 100M</option>
            <option value="100M_1B">100M – 1B</option>
            <option value="TITAN">1B+ (Titans)</option>
          </select>
        </div>
      </div>

      {/* Spies Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4">Target Player</th>
                <th scope="col" className="py-3 px-3">Total Stats (TBS)</th>
                <th scope="col" className="py-3 px-3 hidden md:table-cell">Strength</th>
                <th scope="col" className="py-3 px-3 hidden md:table-cell">Defense</th>
                <th scope="col" className="py-3 px-3 hidden md:table-cell">Speed</th>
                <th scope="col" className="py-3 px-3 hidden md:table-cell">Dexterity</th>
                <th scope="col" className="py-3 px-3">Intel Source</th>
                <th scope="col" className="py-3 px-3">Freshness</th>
                <th scope="col" className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading Faction Spy Vault...
                  </td>
                </tr>
              ) : filteredSpies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    No spy records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredSpies.map((spy) => {
                  const nowSec = Math.floor(Date.now() / 1000);
                  const ageDays = Math.max(0, Math.round((nowSec - spy.timestamp) / 86400));
                  const isFresh = ageDays <= 14;
                  const isStale = ageDays > 45;

                  return (
                    <tr key={spy.playerId} className="hover:bg-slate-800/40 transition">
                      {/* Name & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-sans">
                            {spy.name || `Player [${spy.playerId}]`}
                          </span>
                          <span className="text-[10px] text-slate-400">[{spy.playerId}]</span>
                        </div>
                      </td>

                      {/* Total Stats */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-cyan-400 text-sm">
                          {spy.total ? formatStatNumber(spy.total) : "—"}
                        </span>
                        {spy.fairFight && (
                          <div className="text-[10px] text-slate-400">
                            {spy.fairFight.toFixed(2)}x FF
                          </div>
                        )}
                      </td>

                      {/* Str/Def/Spd/Dex breakdown */}
                      <td className="py-3 px-3 hidden md:table-cell text-slate-300">
                        {spy.strength ? formatStatNumber(spy.strength) : "—"}
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell text-slate-300">
                        {spy.defense ? formatStatNumber(spy.defense) : "—"}
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell text-slate-300">
                        {spy.speed ? formatStatNumber(spy.speed) : "—"}
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell text-slate-300">
                        {spy.dexterity ? formatStatNumber(spy.dexterity) : "—"}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {spy.source}
                        </span>
                      </td>

                      {/* Freshness */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isFresh ? "bg-emerald-400" : isStale ? "bg-rose-400" : "bg-amber-400"
                            }`}
                          />
                          <span className="text-slate-300 text-xs">
                            {ageDays === 0 ? "Today" : `${ageDays}d ago`}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={getDirectAttackUrl(spy.playerId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[32px] px-3 py-1 rounded bg-rose-600/80 hover:bg-rose-500 text-white font-sans text-xs font-bold transition flex items-center gap-1 shadow-sm"
                            aria-label={`Attack ${spy.name || spy.playerId} in Torn`}
                          >
                            <Swords className="w-3 h-3" />
                            <span>Attack</span>
                          </a>

                          <a
                            href={`https://www.torn.com/profiles.php?XID=${spy.playerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            aria-label={`Open profile for ${spy.name || spy.playerId} on Torn.com`}
                            title="Open Profile in Torn"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowImportModal(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 id="import-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Bulk Import Spies</span>
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
                aria-label="Close import dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste spy logs copied from TornStats, leader spreadsheets, or clipboard exports. Lines like:
              <br />
              <code className="text-[11px] text-cyan-300">TargetName [12345] 12.5M</code> or standard Str/Def/Spd/Dex tables.
            </p>

            <div>
              <label htmlFor="bulk-import-text" className="sr-only">
                Paste spy reports text
              </label>
              <textarea
                id="bulk-import-text"
                name="bulkImportText"
                rows={8}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`Valkyrie [3912048] Str: 4.5M Def: 2.1M Spd: 8.2M Dex: 1.1M Total: 15.9M\nIronHide [3829104] 250k`}
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
              />
            </div>

            {importStatus && (
              <div className="text-xs font-mono p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                {importStatus}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowImportModal(false)}
                className="min-h-[38px] px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                className="min-h-[38px] px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-900/40"
              >
                Import to Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

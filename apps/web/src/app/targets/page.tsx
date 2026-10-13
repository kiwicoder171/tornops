"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Target,
  Search,
  Flame,
  ExternalLink,
  Shield,
  Sparkles,
  Download,
  Copy,
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartPulse,
  Award,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plane,
} from "lucide-react";
import {
  BALDR_TARGETS,
  BALDR_LIST_CATEGORIES,
  BaldrTarget,
  getDirectAttackUrl,
  exportToYataFormat,
  exportToIdList,
} from "@torn/shared";
import { useTorn } from "@/context/TornContext";

interface LiveStatusInfo {
  state: "Okay" | "Hospital" | "Traveling" | "Abroad" | "Jail" | "Unknown";
  description: string;
  details?: string | null;
  until?: number | null;
  lastActionRelative?: string;
  checkedAt: number;
}

const PAGE_SIZE = 24;

export default function LevelingTargetsPage() {
  const { isLive, apiKey } = useTorn();

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [maxStatFilter, setMaxStatFilter] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OKAY" | "HOSPITAL" | "TRAVELING">("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Live seconds clock for hospital countdowns
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live status cache: targetId -> LiveStatusInfo
  const [statusCache, setStatusCache] = useState<Record<number, LiveStatusInfo>>({});
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [checkProgress, setCheckProgress] = useState<{ current: number; total: number } | null>(null);

  // Notification state
  const [copiedType, setCopiedType] = useState<"YATA" | "IDS" | null>(null);

  // Filtered targets
  const filteredTargets = useMemo(() => {
    return BALDR_TARGETS.filter((t) => {
      // Category filter
      if (selectedCategory !== "ALL" && t.listCategory !== selectedCategory) {
        return false;
      }

      // Search (name or ID)
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesId = t.id.toString().includes(query);
        if (!matchesName && !matchesId) return false;
      }

      // Level filter
      if (levelFilter === "10-20" && (t.level < 10 || t.level > 20)) return false;
      if (levelFilter === "21-30" && (t.level < 21 || t.level > 30)) return false;
      if (levelFilter === "31+" && t.level < 31) return false;

      // Max stats filter
      if (maxStatFilter > 0 && t.totalStats > maxStatFilter) return false;

      // Status filter
      if (statusFilter !== "ALL") {
        const cached = statusCache[t.id];
        if (!cached) return false; // hide unchecked when filtering strictly by status
        if (statusFilter === "OKAY" && cached.state !== "Okay") return false;
        if (statusFilter === "HOSPITAL" && cached.state !== "Hospital") return false;
        if (statusFilter === "TRAVELING" && cached.state !== "Traveling" && cached.state !== "Abroad") return false;
      }

      return true;
    });
  }, [selectedCategory, search, levelFilter, maxStatFilter, statusFilter, statusCache]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, search, levelFilter, maxStatFilter, statusFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTargets.length / PAGE_SIZE) || 1;
  const paginatedTargets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTargets.slice(start, start + PAGE_SIZE);
  }, [filteredTargets, currentPage]);

  // Check live status for visible targets
  const checkVisibleStatuses = useCallback(async () => {
    if (!isLive || !apiKey || isCheckingStatus) return;

    setIsCheckingStatus(true);
    const targetsToCheck = paginatedTargets;
    setCheckProgress({ current: 0, total: targetsToCheck.length });

    const newStatuses: Record<number, LiveStatusInfo> = {};

    // Process in batches of 4 to stay well below rate limits
    const batchSize = 4;
    for (let i = 0; i < targetsToCheck.length; i += batchSize) {
      const batch = targetsToCheck.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (t) => {
          try {
            const res = await fetch(
              `/api/torn/user/${t.id}?selections=profile&key=${encodeURIComponent(apiKey)}`
            );
            const data = await res.json();
            if (data.profile?.status) {
              newStatuses[t.id] = {
                state: data.profile.status.state,
                description: data.profile.status.description || data.profile.status.state,
                details: data.profile.status.details,
                until: data.profile.status.until || 0,
                lastActionRelative: data.profile.last_action?.relative,
                checkedAt: Date.now(),
              };
            }
          } catch {
            // Keep existing
          }
        })
      );

      setCheckProgress({
        current: Math.min(i + batchSize, targetsToCheck.length),
        total: targetsToCheck.length,
      });

      if (i + batchSize < targetsToCheck.length) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    setStatusCache((prev) => ({ ...prev, ...newStatuses }));
    setIsCheckingStatus(false);
    setCheckProgress(null);
  }, [isLive, apiKey, isCheckingStatus, paginatedTargets]);

  // Automatically check live status when page loads or page changes if connected with key
  const autoCheckedPagesRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!isLive || !apiKey) return;
    // Check if the current page hasn't been checked yet
    if (!autoCheckedPagesRef.current.has(currentPage)) {
      autoCheckedPagesRef.current.add(currentPage);
      checkVisibleStatuses();
    }
  }, [currentPage, isLive, apiKey, checkVisibleStatuses]);

  // Export handlers
  const handleExportYata = () => {
    const jsonStr = exportToYataFormat(filteredTargets);
    navigator.clipboard.writeText(jsonStr);
    setCopiedType("YATA");
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleExportIds = () => {
    const textList = exportToIdList(filteredTargets);
    navigator.clipboard.writeText(textList);
    setCopiedType("IDS");
    setTimeout(() => setCopiedType(null), 3000);
  };

  // Helper to format remaining hospital time
  const formatHospitalRemaining = (untilTimestamp?: number | null) => {
    if (!untilTimestamp) return null;
    const diff = untilTimestamp - currentTimestamp;
    if (diff <= 0) return "Leaving hosp now";
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Target className="w-7 h-7 text-red-500" /> Baldr's Leveling & Chain Target Directory
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-600/20 text-red-300 border border-red-500/30">
              384 Verified Inactive Targets
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Live availability status monitor (<strong className="text-emerald-400">Available to Attack</strong>, <strong className="text-red-400">In Hospital</strong>, <strong className="text-blue-400">Traveling</strong>).
            Always choose <strong className="text-emerald-400 font-semibold">"Leave"</strong> for maximum XP to speedrun Level 15.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {isLive && (
            <button
              onClick={checkVisibleStatuses}
              disabled={isCheckingStatus}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? "animate-spin" : ""}`} />
              {isCheckingStatus
                ? `Checking (${checkProgress?.current}/${checkProgress?.total})...`
                : "Refresh Status (Visible Targets)"}
            </button>
          )}

          <button
            onClick={handleExportYata}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          >
            {copiedType === "YATA" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            {copiedType === "YATA" ? "Copied YATA JSON!" : "Export YATA / TornPDA"}
          </button>

          <button
            onClick={handleExportIds}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          >
            {copiedType === "IDS" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedType === "IDS" ? "Copied IDs!" : "Copy IDs"}
          </button>
        </div>
      </div>

      {/* Target Status Legend / Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block">Total Database</span>
          <span className="text-xl font-bold font-mono text-white">384 Targets</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-emerald-500/30 rounded-xl bg-emerald-950/10">
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Available Status
          </span>
          <span className="text-sm font-semibold text-white mt-1 block">Ready on Streets</span>
          <span className="text-[11px] text-emerald-400/80 font-mono">100% XP on Leave</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-red-500/30 rounded-xl bg-red-950/10">
          <span className="text-xs text-red-400 flex items-center gap-1">
            <HeartPulse className="w-3.5 h-3.5" /> Hospital Status
          </span>
          <span className="text-sm font-semibold text-white mt-1 block">Live Hospital Timer</span>
          <span className="text-[11px] text-red-400/80 font-mono">Counts down in secs</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-blue-500/30 rounded-xl bg-blue-950/10">
          <span className="text-xs text-blue-400 flex items-center gap-1">
            <Plane className="w-3.5 h-3.5" /> Traveling Status
          </span>
          <span className="text-sm font-semibold text-white mt-1 block">Abroad / In Flight</span>
          <span className="text-[11px] text-blue-400/80 font-mono">Skip until landed</span>
        </div>
      </div>

      {/* Sub-List Category Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
        {BALDR_LIST_CATEGORIES.map((cat) => {
          const count = cat === "ALL" ? BALDR_TARGETS.length : BALDR_TARGETS.filter((t) => t.listCategory === cat).length;
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <span>{cat === "ALL" ? "All Categories" : cat}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  isSelected ? "bg-purple-500/30 text-purple-200" : "bg-slate-800 text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Secondary Filter Controls */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="searchTarget"
            name="searchTarget"
            aria-label="Search by name or Torn ID"
            type="text"
            placeholder="Search by name or Torn ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Status Filter */}
          <div className="flex items-center flex-wrap sm:flex-nowrap bg-slate-950 border border-slate-800 p-0.5 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`flex-1 sm:flex-initial px-2 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${
                statusFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All Statuses
            </button>
            <button
              onClick={() => setStatusFilter("OKAY")}
              className={`flex-1 sm:flex-initial px-2 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                statusFilter === "OKAY" ? "bg-emerald-600/30 text-emerald-300 font-semibold" : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" /> Available
            </button>
            <button
              onClick={() => setStatusFilter("HOSPITAL")}
              className={`flex-1 sm:flex-initial px-2 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                statusFilter === "HOSPITAL" ? "bg-red-600/30 text-red-300 font-semibold" : "text-slate-400 hover:text-red-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" /> Hospital
            </button>
            <button
              onClick={() => setStatusFilter("TRAVELING")}
              className={`flex-1 sm:flex-initial px-2 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                statusFilter === "TRAVELING" ? "bg-blue-600/30 text-blue-300 font-semibold" : "text-slate-400 hover:text-blue-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" /> Traveling
            </button>
          </div>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Levels</option>
            <option value="10-20">Lvl 10 - 20</option>
            <option value="21-30">Lvl 21 - 30</option>
            <option value="31+">Lvl 31+</option>
          </select>

          {/* Max Stat Filter */}
          <select
            value={maxStatFilter}
            onChange={(e) => setMaxStatFilter(parseInt(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value={0}>Any Stats</option>
            <option value={500}>Max &lt; 500 Stats</option>
            <option value={1000}>Max &lt; 1,000 Stats</option>
            <option value={5000}>Max &lt; 5,000 Stats</option>
            <option value={25000}>Max &lt; 25,000 Stats</option>
          </select>
        </div>
      </div>

      {/* Target Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedTargets.map((target) => {
          const liveStatus = statusCache[target.id];
          const isOkay = liveStatus?.state === "Okay";
          const isHospital = liveStatus?.state === "Hospital";
          const isTraveling = liveStatus?.state === "Traveling" || liveStatus?.state === "Abroad";
          const remainingText = liveStatus ? formatHospitalRemaining(liveStatus.until) : null;

          return (
            <div
              key={target.id}
              className={`p-4 bg-slate-900 rounded-xl transition-all flex flex-col justify-between space-y-4 border ${
                isOkay
                  ? "border-emerald-500/40 hover:border-emerald-500/70 shadow-lg shadow-emerald-950/20"
                  : isHospital
                  ? "border-red-900/50 hover:border-red-700/60"
                  : isTraveling
                  ? "border-blue-900/50 hover:border-blue-700/60"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                {/* Header: Name, ID & Level */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <a
                      href={`https://www.torn.com/profiles.php?XID=${target.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-white text-base hover:text-blue-400 transition-colors truncate flex items-center gap-1"
                    >
                      {target.name}
                      <ExternalLink className="w-3 h-3 text-slate-500 inline-block" />
                    </a>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 font-mono">ID: #{target.id}</span>
                      <span className="text-[10px] text-slate-500">• {target.listCategory}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-mono text-xs font-bold rounded-lg border border-purple-500/30 whitespace-nowrap">
                    Lvl {target.level}
                  </span>
                </div>

                {/* PROMINENT LIVE STATUS BANNER */}
                <div className="mt-3">
                  {liveStatus ? (
                    isOkay ? (
                      <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>AVAILABLE TO ATTACK</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-medium">
                          On Streets
                        </span>
                      </div>
                    ) : isHospital ? (
                      <div className="p-2.5 bg-red-950/40 border border-red-500/40 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-red-400">
                          <span className="flex items-center gap-1.5">
                            <HeartPulse className="w-4 h-4 text-red-400" />
                            HOSPITALIZED
                          </span>
                          <span className="font-mono text-red-300 text-[11px] font-semibold bg-red-900/40 px-1.5 py-0.5 rounded">
                            {remainingText || liveStatus.description}
                          </span>
                        </div>
                        {liveStatus.details && (
                          <p className="text-[11px] text-red-300/80 truncate">
                            {liveStatus.details}
                          </p>
                        )}
                      </div>
                    ) : isTraveling ? (
                      <div className="p-2.5 bg-blue-950/40 border border-blue-500/40 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-blue-400">
                          <Plane className="w-4 h-4 text-blue-400" />
                          <span>TRAVELING ABROAD</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded font-medium">
                          Skip for now
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5 text-slate-300">
                        <AlertCircle className="w-4 h-4 text-slate-400" />
                        <span>Status: {liveStatus.state}</span>
                      </div>
                    )
                  ) : isCheckingStatus ? (
                    <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs flex items-center gap-2 text-amber-300 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Checking live availability...</span>
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-600" />
                        Status: Unchecked
                      </span>
                      <span className="text-[10px] text-slate-500">Auto-checks on view</span>
                    </div>
                  )}
                </div>

                {/* Stat Breakdown Grid */}
                <div className="mt-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                    <span className="text-slate-400">Total Stats:</span>
                    <strong className="font-mono text-emerald-400 text-sm">
                      {target.totalStats.toLocaleString()}
                    </strong>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400 font-mono">
                    <div>
                      Str: <span className="text-slate-200">{target.str.toLocaleString()}</span>
                    </div>
                    <div>
                      Def: <span className="text-slate-200">{target.def.toLocaleString()}</span>
                    </div>
                    <div>
                      Spd: <span className="text-slate-200">{target.spd.toLocaleString()}</span>
                    </div>
                    <div>
                      Dex: <span className="text-slate-200">{target.dex.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button: Direct Attack URL */}
              <div className="pt-2 border-t border-slate-800/80">
                {isHospital ? (
                  <a
                    href={getDirectAttackUrl(target.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all border border-slate-700 hover:text-white"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> In Hospital ({remainingText || "Unavailable"})
                  </a>
                ) : isTraveling ? (
                  <a
                    href={getDirectAttackUrl(target.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all border border-slate-700 hover:text-white"
                  >
                    <Plane className="w-3.5 h-3.5 text-blue-400" /> Target Traveling Abroad
                  </a>
                ) : (
                  <a
                    href={getDirectAttackUrl(target.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-red-600/20 active:scale-95"
                  >
                    <Flame className="w-3.5 h-3.5" /> Attack Target Now (Leave for XP)
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {paginatedTargets.length === 0 && (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Targets Match Your Filters</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter !== "ALL"
              ? `No targets on this page currently match the status filter "${statusFilter}". Click "Refresh Status" or switch to "All Statuses".`
              : "Try clearing your search term, adjusting the level or stat ceiling, or selecting 'All Categories'."}
          </p>
        </div>
      )}

      {/* Pagination Bar */}
      {filteredTargets.length > PAGE_SIZE && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{(currentPage - 1) * PAGE_SIZE + 1}</strong> to{" "}
            <strong className="text-white">
              {Math.min(currentPage * PAGE_SIZE, filteredTargets.length)}
            </strong>{" "}
            of <strong className="text-white">{filteredTargets.length}</strong> targets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            <span className="font-mono text-slate-300 px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1 transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

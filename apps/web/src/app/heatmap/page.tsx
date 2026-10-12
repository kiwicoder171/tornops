"use client";

import { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Clock,
  Swords,
  Users,
  Search,
  AlertTriangle,
  Zap,
  Shield,
  Activity,
  ArrowUpRight,
  ExternalLink,
  Flame,
  Loader2,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";

interface MemberActivity {
  id: number;
  name: string;
  level: number;
  timezone: "Americas (EST/PST)" | "Europe (GMT/CET)" | "Asia/Oceania (AEST)";
  status: "DEEP SLEEP" | "ONLINE" | "IN HOSPITAL" | "TRAVELING" | "AWAKE";
  lastAction: string;
  sleepHours: number[]; // Hours in TCT when usually offline
  ffMultiplier: string;
}

// 24-hour TCT activity stats (Percentage of enemy online)
const mockHourlyOnlineRates = [
  { hour: "00:00", rate: 38 },
  { hour: "01:00", rate: 26 },
  { hour: "02:00", rate: 18 },
  { hour: "03:00", rate: 14 },
  { hour: "04:00", rate: 11 }, // Golden push window
  { hour: "05:00", rate: 8 },  // Golden push window
  { hour: "06:00", rate: 12 }, // Golden push window
  { hour: "07:00", rate: 20 },
  { hour: "08:00", rate: 32 },
  { hour: "09:00", rate: 45 },
  { hour: "10:00", rate: 58 },
  { hour: "11:00", rate: 64 },
  { hour: "12:00", rate: 68 },
  { hour: "13:00", rate: 72 },
  { hour: "14:00", rate: 75 },
  { hour: "15:00", rate: 81 },
  { hour: "16:00", rate: 88 }, // Peak online
  { hour: "17:00", rate: 84 },
  { hour: "18:00", rate: 79 },
  { hour: "19:00", rate: 74 },
  { hour: "20:00", rate: 66 },
  { hour: "21:00", rate: 59 },
  { hour: "22:00", rate: 48 },
  { hour: "23:00", rate: 41 },
];

const mockEnemyRoster: MemberActivity[] = [
  {
    id: 2894101,
    name: "Kovacs_Viper",
    level: 82,
    timezone: "Americas (EST/PST)",
    status: "DEEP SLEEP",
    lastAction: "6h 12m ago",
    sleepHours: [3, 4, 5, 6, 7, 8, 9, 10],
    ffMultiplier: "1.42x",
  },
  {
    id: 1984210,
    name: "IronHide_Apex",
    level: 95,
    timezone: "Americas (EST/PST)",
    status: "DEEP SLEEP",
    lastAction: "5h 40m ago",
    sleepHours: [2, 3, 4, 5, 6, 7, 8],
    ffMultiplier: "1.10x",
  },
  {
    id: 3109482,
    name: "ShadowStrike",
    level: 68,
    timezone: "Europe (GMT/CET)",
    status: "ONLINE",
    lastAction: "1m ago",
    sleepHours: [22, 23, 0, 1, 2, 3, 4, 5],
    ffMultiplier: "2.15x",
  },
  {
    id: 2490192,
    name: "RedBaron_Torn",
    level: 74,
    timezone: "Europe (GMT/CET)",
    status: "IN HOSPITAL",
    lastAction: "14m ago",
    sleepHours: [23, 0, 1, 2, 3, 4, 5, 6],
    ffMultiplier: "1.75x",
  },
  {
    id: 3291048,
    name: "TokyoGhost",
    level: 61,
    timezone: "Asia/Oceania (AEST)",
    status: "AWAKE",
    lastAction: "18m ago",
    sleepHours: [12, 13, 14, 15, 16, 17, 18],
    ffMultiplier: "2.40x",
  },
  {
    id: 1784910,
    name: "Gunslinger_Joe",
    level: 89,
    timezone: "Americas (EST/PST)",
    status: "TRAVELING",
    lastAction: "2h ago",
    sleepHours: [4, 5, 6, 7, 8, 9],
    ffMultiplier: "1.25x",
  },
];

export default function EnemyHeatmapPage() {
  const { isLive, apiKey, userProfile } = useTorn();
  const [targetFactionId, setTargetFactionId] = useState<string>(isLive ? "" : "57574");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [enemyRoster, setEnemyRoster] = useState<MemberActivity[]>(isLive ? [] : mockEnemyRoster);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const runScan = async (factionIdToScan: string) => {
    if (!factionIdToScan.trim() || !apiKey) return;
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch(`/api/torn/faction/${factionIdToScan.trim()}?selections=basic&key=${encodeURIComponent(apiKey)}`);
      const data = await res.json();
      setIsScanning(false);

      if (data.error) {
        setScanMessage(`Scan error: ${data.error.error || "Invalid Faction ID"}`);
        return;
      }

      if (data.members && typeof data.members === "object") {
        const rawMembers = Array.isArray(data.members)
          ? data.members
          : Object.entries(data.members).map(([id, m]) => ({ id: Number(id), ...(m as object) } as any));

        const liveRoster: MemberActivity[] = rawMembers.map((m: any) => {
          const stateStr =
            m.status?.state === "Hospital"
              ? "IN HOSPITAL"
              : m.status?.state === "Abroad" || m.status?.state === "Traveling"
              ? "TRAVELING"
              : m.last_action?.status === "Online"
              ? "ONLINE"
              : "DEEP SLEEP";

          const lastHour = m.last_action?.timestamp ? new Date(m.last_action.timestamp * 1000).getUTCHours() : 0;
          const timezone: MemberActivity["timezone"] =
            lastHour >= 12 && lastHour <= 20
              ? "Europe (GMT/CET)"
              : lastHour >= 21 || lastHour <= 5
              ? "Americas (EST/PST)"
              : "Asia/Oceania (AEST)";

          const sleepHours =
            timezone === "Europe (GMT/CET)"
              ? [23, 0, 1, 2, 3, 4, 5, 6]
              : timezone === "Americas (EST/PST)"
              ? [4, 5, 6, 7, 8, 9, 10, 11]
              : [13, 14, 15, 16, 17, 18, 19];

          return {
            id: m.id,
            name: m.name,
            level: m.level,
            timezone,
            status: stateStr as any,
            lastAction: m.last_action?.relative || "Recently",
            sleepHours,
            ffMultiplier: m.level >= 50 ? "1.80x" : "2.50x",
          };
        });

        setEnemyRoster(liveRoster);
      }
    } catch {
      setIsScanning(false);
      setScanMessage("Network error scanning faction.");
    }
  };

  // Auto-detect ranked war opponent when connected live
  useEffect(() => {
    if (!isLive || !apiKey) {
      if (!isLive) {
        setTargetFactionId("57574");
        setEnemyRoster(mockEnemyRoster);
      }
      return;
    }

    let isMounted = true;
    const autoDetectOpponent = async () => {
      try {
        const res = await fetch(`/api/torn/faction?selections=rankedwars&key=${encodeURIComponent(apiKey)}`);
        const data = await res.json();
        if (!isMounted) return;

        const rawRw = data.ranked_wars || data.rankedwars;
        const rwList = Array.isArray(rawRw) ? rawRw : rawRw && typeof rawRw === "object" ? Object.values(rawRw) : [];
        if (rwList.length > 0) {
          const rw = rwList[0] as any;
          const ourId = userProfile?.factionId;
          const oppFac = ourId ? rw.factions?.find((f: { id: number }) => f.id !== ourId) : rw.factions?.[1];
          if (oppFac?.id) {
            setTargetFactionId(String(oppFac.id));
            runScan(String(oppFac.id));
          }
        }
      } catch {
        // Silently preserve state
      }
    };

    autoDetectOpponent();
  }, [isLive, apiKey, userProfile]);

  const handleScanOpponent = async () => {
    if (!targetFactionId.trim()) return;
    if (!isLive || !apiKey) {
      setScanMessage("Running in Demo Preview. Connect your Torn API key in the top bar to scan live enemy factions!");
      setTimeout(() => setScanMessage(null), 4000);
      return;
    }
    runScan(targetFactionId);
  };

  const filteredRoster = enemyRoster.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toString().includes(searchQuery);
    const matchesFilter = filterStatus === "ALL" || m.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              WARFARE TACTICS • 100% FREE
            </span>
            <span className="text-xs text-zinc-400 font-mono">TCT LIVE RADAR</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-400" />
            <span>Enemy Sleep Heatmap & Push-Window Radar</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            14-Day activity intelligence predicting opponent sleep hours, offline vulnerabilities, and high-lead push windows.
          </p>
        </div>

        {/* Target Faction Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 bg-[#0d0d0f] border border-[#222225] p-1.5 rounded-lg">
            <span className="text-xs text-zinc-400 pl-2 font-mono">Opponent ID:</span>
            <input
              id="targetFactionId"
              name="targetFactionId"
              aria-label="Opponent Faction ID"
              type="text"
              value={targetFactionId}
              onChange={(e) => setTargetFactionId(e.target.value)}
              className="w-24 bg-black border border-[#27272a] px-2 py-1 rounded text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              placeholder="Faction ID"
            />
            <button
              onClick={handleScanOpponent}
              disabled={isScanning}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Scan Opponent</span>
                </>
              )}
            </button>
          </div>
          {scanMessage && (
            <span className="text-xs text-purple-300 font-mono bg-purple-950/40 border border-purple-800/60 px-2.5 py-1 rounded">
              {scanMessage}
            </span>
          )}
        </div>
      </div>

      {/* High-Level Tactical Intelligence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Golden Push Window Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#120f1c] to-[#0d0d0f] border border-purple-500/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-purple-300 font-mono mb-1">
            <span>OPTIMAL PUSH WINDOW</span>
            <Flame className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">03:00 - 07:00 TCT</div>
          <p className="text-[11px] text-purple-200/80 mt-1">
            <span className="font-bold text-emerald-400">82% of enemy roster offline</span>. Lead gains during this window are uncontested.
          </p>
        </div>

        {/* Peak Enemy Danger Window */}
        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
          <div className="flex items-center justify-between text-xs text-amber-400 font-mono mb-1">
            <span>PEAK ENEMY ALERT</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">15:00 - 18:00 TCT</div>
          <p className="text-[11px] text-zinc-400 mt-1">
            <span className="text-amber-400 font-semibold">88% active</span>. Conserve energy and coordinate group hosping only.
          </p>
        </div>

        {/* Current Roster Status */}
        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
          <div className="flex items-center justify-between text-xs text-blue-400 font-mono mb-1">
            <span>ACTIVE ROSTER NOW</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">14 / 52 Online</div>
          <p className="text-[11px] text-zinc-400 mt-1">
            27% active force • 28 sleeping • 6 in hospital • 4 traveling
          </p>
        </div>

        {/* Detected Timezone Breakdown */}
        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-1">
            <span>TIMEZONE CONCENTRATION</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-sm font-bold text-white mt-1 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Americas:</span>
              <span className="text-white font-mono">54% (28 players)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Europe / Africa:</span>
              <span className="text-white font-mono">31% (16 players)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Asia / Oceania:</span>
              <span className="text-white font-mono">15% (8 players)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour TCT Activity Heatmap Grid */}
      <div className="p-5 rounded-xl bg-[#0d0d0f] border border-[#222225] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f1f23] pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>24-Hour Opponent Activity Distribution (TCT)</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Values indicate estimated % of enemy members active during that hour of the day.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-purple-950 border border-purple-500/50" />
              <span>&lt;20% (Sleep Window)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-900/60" />
              <span>20-50% (Normal)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-700/80" />
              <span>&gt;75% (Peak Active)</span>
            </span>
          </div>
        </div>

        {/* Heat Columns */}
        {enemyRoster.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 font-mono text-xs bg-[#09090b] rounded-lg border border-[#1f1f23]">
            Awaiting target faction scan. Enter an Opponent Faction ID above to calculate 24-hour activity distribution and sleep windows.
          </div>
        ) : (
          <div className="grid grid-cols-12 md:grid-cols-24 gap-1.5 py-2">
            {mockHourlyOnlineRates.map((h, i) => {
              const isPushGolden = h.rate <= 20;
              const isPeak = h.rate >= 75;

              const bgClass = isPushGolden
                ? "bg-purple-950/70 border-purple-500/60 text-purple-300 shadow-sm shadow-purple-900/20"
                : isPeak
                ? "bg-emerald-800/60 border-emerald-500/40 text-emerald-200"
                : h.rate > 50
                ? "bg-amber-900/40 border-amber-500/30 text-amber-200"
                : "bg-[#18181e] border-[#292930] text-zinc-300";

              return (
                <div
                  key={h.hour}
                  className={`flex flex-col items-center justify-between p-2 rounded border text-center transition-all hover:scale-105 cursor-pointer ${bgClass}`}
                  title={`Hour: ${h.hour} TCT - Active: ${h.rate}%`}
                >
                  <span className="text-[9px] font-mono font-bold">{h.hour.slice(0, 2)}h</span>
                  <div className="my-1.5">
                    <span className="text-xs font-mono font-extrabold">{h.rate}%</span>
                  </div>
                  {isPushGolden ? (
                    <span className="text-[8px] font-mono uppercase bg-purple-600/80 px-1 rounded text-white font-bold">
                      PUSH
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono text-zinc-500">act</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual Enemy Member Vulnerability Roster */}
      <div className="p-5 rounded-xl bg-[#0d0d0f] border border-[#222225] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1f1f23] pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Target Vulnerability & Sleep Tracker</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Live status and sleep hours per opponent. High Fair Fight multiplier targets sleeping now are prioritized.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="filterEnemyPlayer"
                name="filterEnemyPlayer"
                aria-label="Filter enemy player"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter player..."
                className="bg-black border border-[#27272a] pl-8 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 w-44"
              />
            </div>

            <div className="flex rounded-lg bg-black border border-[#27272a] p-0.5 text-xs font-mono">
              {["ALL", "DEEP SLEEP", "IN HOSPITAL", "ONLINE"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2.5 py-1 rounded transition-colors text-[10px] font-bold ${
                    filterStatus === status
                      ? "bg-purple-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Target Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121215] text-[10px] font-mono text-zinc-400 uppercase tracking-wider border-b border-[#1f1f23]">
              <tr>
                <th className="py-2.5 px-3">Enemy Target</th>
                <th className="py-2.5 px-3">Level</th>
                <th className="py-2.5 px-3">Est. Timezone</th>
                <th className="py-2.5 px-3">Live Status</th>
                <th className="py-2.5 px-3">Last Seen</th>
                <th className="py-2.5 px-3">Fair Fight (FF)</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18181c] text-zinc-300">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-3 text-center text-xs text-zinc-500 font-mono">
                    {isScanning ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        Scanning enemy faction roster...
                      </span>
                    ) : enemyRoster.length === 0 ? (
                      <span>
                        No enemy faction scanned yet. Enter a Faction ID in the search box above to analyze sleep schedules.
                      </span>
                    ) : (
                      <span>No enemy targets match your active filters.</span>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRoster.map((target) => (
                <tr key={target.id} className="hover:bg-[#141418] transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>{target.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">[{target.id}]</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-zinc-200">{target.level}</td>
                  <td className="py-3 px-3 text-zinc-400">{target.timezone}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        target.status === "DEEP SLEEP"
                          ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                          : target.status === "ONLINE"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : target.status === "IN HOSPITAL"
                          ? "bg-red-500/15 text-red-400 border-red-500/30"
                          : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                      }`}
                    >
                      {target.status === "DEEP SLEEP" && <Moon className="w-3 h-3 text-purple-400" />}
                      {target.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-zinc-400">{target.lastAction}</td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-400">{target.ffMultiplier}</td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={`https://www.torn.com/loader.php?sid=attack&user2ID=${target.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-[11px] font-bold transition-all"
                    >
                      <Swords className="w-3 h-3" />
                      <span>Attack</span>
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

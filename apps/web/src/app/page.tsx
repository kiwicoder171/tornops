"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Swords,
  ArrowUpRight,
  Clock,
  Award,
  Users,
  Trophy,
  Zap,
  Target,
  Calculator,
  Shield,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";
import { formatChainTime } from "@torn/shared";

interface LiveChainData {
  current: number;
  max: number;
  timeout: number;
  modifier: number;
  cooldown: number;
}

interface LiveWarSummary {
  opponentName: string;
  opponentId: number;
  ourScore: number;
  opponentScore: number;
  lead: number;
  isWon: boolean;
  statusLabel: string;
}

export default function OverviewPage() {
  const { isLive, apiKey, userProfile } = useTorn();
  const [chainData, setChainData] = useState<LiveChainData>({
    current: 0,
    max: 10,
    timeout: 0,
    modifier: 1,
    cooldown: 0,
  });

  const [warSummary, setWarSummary] = useState<LiveWarSummary>({
    opponentName: "Storm Heralds",
    opponentId: 57574,
    ourScore: 2409,
    opponentScore: 1573,
    lead: 836,
    isWon: true,
    statusLabel: "VICTORY",
  });

  const [factionStats, setFactionStats] = useState({
    members: 19,
    respect: 10465,
    tag: "MD",
  });

  // If live key is connected, poll live faction telemetry
  useEffect(() => {
    if (!isLive || !apiKey) return;

    let isMounted = true;
    const fetchLiveData = async () => {
      try {
        const res = await fetch(`/api/torn/faction?selections=chain,rankedwars,basic&key=${encodeURIComponent(apiKey)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data.chain) {
          setChainData(data.chain);
        }

        const membersCount = data.members && typeof data.members === "object" ? Object.keys(data.members).length : (data.basic?.members || 20);
        const respectVal = data.respect ?? data.basic?.respect ?? 10465;
        const tagVal = data.tag ?? data.basic?.tag ?? "MD";

        setFactionStats({
          members: membersCount,
          respect: respectVal,
          tag: tagVal,
        });

        // Process Ranked Wars (handles both Torn v1 dictionary and array)
        const rawRw = data.ranked_wars || data.rankedwars;
        const rwList = Array.isArray(rawRw) ? rawRw : rawRw && typeof rawRw === "object" ? Object.values(rawRw) : [];
        if (rwList.length > 0) {
          const rw = rwList[0];
          const ourFacId = userProfile?.factionId || 57693;
          const ourFac = rw.factions?.find((f: { id: number }) => f.id === ourFacId);
          const oppFac = rw.factions?.find((f: { id: number }) => f.id !== ourFacId);

          if (ourFac && oppFac) {
            const isWon = rw.winner === ourFacId;
            setWarSummary({
              opponentName: oppFac.name || "Opponent",
              opponentId: oppFac.id || 0,
              ourScore: ourFac.score || 0,
              opponentScore: oppFac.score || 0,
              lead: (ourFac.score || 0) - (oppFac.score || 0),
              isWon,
              statusLabel: rw.end ? (isWon ? "VICTORY" : "DEFEAT") : "LIVE WAR",
            });
          }
        }
      } catch {
        // Silently preserve data on error
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLive, apiKey, userProfile]);

  const chainPercentage = chainData.max > 0 ? Math.min(100, Math.round((chainData.current / chainData.max) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Operations Command
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isLive && userProfile ? (
              <>
                Connected to <span className="font-semibold text-emerald-400">{userProfile.factionName || "Mildly Dangerous"}</span> <span className="font-mono text-slate-400 tabular-nums">[{userProfile.factionId || 57693}]</span> as <span className="text-white font-medium">{userProfile.name}</span> <span className="font-mono text-slate-400 tabular-nums">[{userProfile.playerId}]</span>
              </>
            ) : (
              "Tactical mission control: live chain telemetry, ranked war status, and resource readiness."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300 flex items-center gap-2">
            <span className="text-slate-400">Faction Tag:</span>
            <span className="font-mono font-bold text-blue-400">[{factionStats.tag}]</span>
          </div>
          <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300 flex items-center gap-2">
            <span className="text-slate-400">Roster:</span>
            <span className="font-mono font-bold text-white tabular-nums">{factionStats.members}</span>
          </div>
        </div>
      </div>

      {/* Top Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chain Widget */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Faction Chain</span>
              <span
                className={`flex h-2 w-2 rounded-full ${
                  chainData.current > 0
                    ? chainData.timeout <= 60
                      ? "bg-red-500 animate-ping"
                      : chainData.timeout <= 120
                      ? "bg-amber-400 animate-pulse"
                      : "bg-emerald-400 animate-pulse"
                    : "bg-slate-600"
                }`}
              />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums">{chainData.current}</span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">/ {chainData.max || 10} hits</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Timeout:
              </span>
              <span
                className={`font-mono font-bold tabular-nums ${
                  chainData.current === 0
                    ? "text-slate-400"
                    : chainData.timeout <= 60
                    ? "text-red-400"
                    : chainData.timeout <= 120
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {chainData.current > 0 ? formatChainTime(chainData.timeout) : "Idle / Standby"}
              </span>
            </div>
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  chainData.timeout <= 60 ? "bg-red-500" : chainData.timeout <= 120 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${chainPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ranked War */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ranked War</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-semibold rounded inline-flex items-center gap-1 ${
                  warSummary.isWon
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                {warSummary.isWon ? <Trophy className="w-3 h-3 text-emerald-400" /> : <Zap className="w-3 h-3 text-blue-400" />}
                <span>{warSummary.statusLabel}</span>
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono tabular-nums ${warSummary.lead >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {warSummary.lead >= 0 ? `+${warSummary.lead.toLocaleString()}` : warSummary.lead.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">{warSummary.isWon ? "Margin" : "Delta"}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 flex items-center justify-between mb-1.5">
              <span className="truncate max-w-[120px]">vs {warSummary.opponentName}</span>
              <span className="font-mono text-slate-300 tabular-nums">
                {warSummary.ourScore.toLocaleString()} : {warSummary.opponentScore.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[60%]" />
            </div>
          </div>
        </div>

        {/* Faction Respect */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Faction Respect</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums">{factionStats.respect.toLocaleString()}</span>
              <span className="text-xs text-purple-400 font-medium">pts</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 flex items-center justify-between mb-1.5">
              <span>Active Faction Roster:</span>
              <span className="text-slate-200 font-mono font-medium tabular-nums">{factionStats.members} Members</span>
            </div>
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full w-[85%]" />
            </div>
          </div>
        </div>

        {/* Crimes 2.0 Status */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Crimes 2.0 Teams</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums">4</span>
              <span className="text-xs text-blue-400 font-medium">Scheduled</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 flex items-center justify-between mb-1.5">
              <span>Team Readiness:</span>
              <span className="text-emerald-400 font-medium">100% Prepared</span>
            </div>
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-[100%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Modules Navigation */}
      {/* War & Combat Operations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            War & Combat Operations
          </h2>
          <span className="text-[11px] text-[#71717a]">Ranked War battle coordination</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/war"
            className="p-4 bg-[#0d0d0f] hover:bg-[#141416] border border-[#222225] hover:border-red-500/40 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Swords className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#71717a] group-hover:text-red-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white text-sm">Ranked War Room</h3>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                Live hospital timers, chain telemetry, and one-click direct attack links.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1f1f23] text-[11px] text-red-400 font-medium">
              Open War Room &rarr;
            </div>
          </Link>

          <Link
            href="/heatmap"
            className="p-4 bg-[#0d0d0f] hover:bg-[#141416] border border-[#222225] hover:border-purple-500/40 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300">
                  PRO
                </span>
              </div>
              <h3 className="font-semibold text-white text-sm">Enemy Sleep Heatmap</h3>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                24h TCT sleep radar to predict opponent offline windows for easy 250-point pushes.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1f1f23] text-[11px] text-purple-400 font-medium">
              Predict Sleep Window &rarr;
            </div>
          </Link>

          <Link
            href="/revives"
            className="p-4 bg-[#0d0d0f] hover:bg-[#141416] border border-[#222225] hover:border-red-500/40 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-500/20 text-red-300">
                  LIVE
                </span>
              </div>
              <h3 className="font-semibold text-white text-sm">War Revive Dispatch</h3>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                Live hospital triage board, 1-click reviver links, and automated Xanax payout ledger.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1f1f23] text-[11px] text-red-400 font-medium">
              Open Hospital Queue &rarr;
            </div>
          </Link>

          <Link
            href="/payout"
            className="p-4 bg-[#0d0d0f] hover:bg-[#141416] border border-[#222225] hover:border-blue-500/40 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Calculator className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#71717a] group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white text-sm">Fair-Share Payouts</h3>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                War reward allocation algorithm with clutch bonuses, CSV export, and vault payload.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1f1f23] text-[11px] text-blue-400 font-medium">
              Calculate Payouts &rarr;
            </div>
          </Link>
        </div>
      </div>

      {/* Faction & Operations Modules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Faction & Citizen Operations
          </h2>
          <span className="text-[11px] text-[#71717a]">Armory, recruiting & global economy</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/armory"
            className="p-4 bg-[#0d0d0f] hover:bg-[#141416] border border-[#222225] hover:border-amber-500/40 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#71717a] group-hover:text-amber-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white text-sm">Armory & Loaners</h3>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                Track loaned armor & RW weapons, overdue item recalls, and drug usage audits.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1f1f23] text-[11px] text-amber-400 font-medium">
              Audit Armory &rarr;
            </div>
          </Link>

          <Link
            href="/recruitment"
            className="p-4 bg-[#0d0d0f] hover:bg-[#141416] border border-[#222225] hover:border-blue-500/40 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/20 text-blue-300">
                  RADAR
                </span>
              </div>
              <h3 className="font-semibold text-white text-sm">Recruitment Radar</h3>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                Scan active factionless players with 1-click personalized pitch letters.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1f1f23] text-[11px] text-blue-400 font-medium">
              Scout Members &rarr;
            </div>
          </Link>

          <Link
            href="/travel"
            className="p-4 bg-[#0d0d0f] hover:bg-[#141416] border border-[#222225] hover:border-emerald-500/40 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300">
                  FREE
                </span>
              </div>
              <h3 className="font-semibold text-white text-sm">Travel & Stock Radar</h3>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                Safe-landing mug alarms and overseas stock checker for plushies, flowers & Xanax.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1f1f23] text-[11px] text-emerald-400 font-medium">
              View Flight Radar &rarr;
            </div>
          </Link>

          <Link
            href="/pricing"
            className="p-4 bg-[#0d0d0f] hover:bg-[#141416] border border-[#222225] hover:border-purple-500/40 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300">
                  XANAX
                </span>
              </div>
              <h3 className="font-semibold text-white text-sm">Plans & Xanax Passes</h3>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                Freemium tier access powered by in-game Xanax item transfers (inspired by TornCrew).
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#1f1f23] text-[11px] text-purple-400 font-medium">
              Upgrade Access &rarr;
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

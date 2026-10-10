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

        if (data.basic) {
          setFactionStats({
            members: data.basic.members || 19,
            respect: data.basic.respect || 10465,
            tag: data.basic.tag || "MD",
          });
        }

        // Process Ranked Wars
        const rwList = Array.isArray(data.rankedwars) ? data.rankedwars : [];
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
      <div>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Tactical Operations Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/war"
            className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Swords className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white text-sm">Ranked War Room</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Live hospital timers, enemy sleep windows, and one-click direct attack links.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-800 text-[11px] text-blue-400 font-medium">
              Open War Room &rarr;
            </div>
          </Link>

          <Link
            href="/payout"
            className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Calculator className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white text-sm">Fair-Share Payouts</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                War reward allocation algorithm with clutch bonuses, CSV export, and userscript payload.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-800 text-[11px] text-blue-400 font-medium">
              Calculate Payouts &rarr;
            </div>
          </Link>

          <Link
            href="/targets"
            className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Target className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white text-sm">Baldr Leveling Targets</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                384 curated high-XP / low-stat targets with live status checks and instant attack buttons.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-800 text-[11px] text-blue-400 font-medium">
              Browse Targets &rarr;
            </div>
          </Link>

          <Link
            href="/oc"
            className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white text-sm">Crimes 2.0 Planner</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Team assignment optimizer with role-gated AA controls and member skill check.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-800 text-[11px] text-blue-400 font-medium">
              Plan Crimes &rarr;
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

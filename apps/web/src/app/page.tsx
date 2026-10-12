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

      {/* Tactical Modules Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* War & Combat Operations */}
        <div className="p-4 bg-[#0e0e11] border border-[#222225] rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#18181b]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                  War & Combat Intelligence
                </h2>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">Ranked Wars & Battles</span>
            </div>

            <div className="divide-y divide-[#18181b] mt-1">
              <Link
                href="/war"
                className="group flex items-center justify-between py-3 hover:bg-[#151519] px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
                    <Swords className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-red-400 transition-colors flex items-center gap-2">
                      Ranked War Room
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                        LIVE
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Live hospital timers, chain countdowns, and 1-click direct attack links.
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 ml-2" />
              </Link>

              <Link
                href="/heatmap"
                className="group flex items-center justify-between py-3 hover:bg-[#151519] px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
                      Enemy Sleep Heatmap
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        FREE
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      24h TCT opponent activity radar to predict offline 250-point push windows.
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 ml-2" />
              </Link>

              <Link
                href="/revives"
                className="group flex items-center justify-between py-3 hover:bg-[#151519] px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      War Revive Dispatch
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Live hospital triage board, 1-click reviver links, and automated Xanax payout ledger.
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 ml-2" />
              </Link>

              <Link
                href="/payout"
                className="group flex items-center justify-between py-3 hover:bg-[#151519] px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                      Fair-Share War Payouts
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      War pot allocation algorithm with clutch bonuses, CSV export, and vault payloads.
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* Faction & Economy Operations */}
        <div className="p-4 bg-[#0e0e11] border border-[#222225] rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#18181b]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Faction Operations & Economy
                </h2>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">Logistics & Citizen Suite</span>
            </div>

            <div className="divide-y divide-[#18181b] mt-1">
              <Link
                href="/armory"
                className="group flex items-center justify-between py-3 hover:bg-[#151519] px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                      Armory & Loaner Item Tracker
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Track loaned armor & RW weapons, overdue item recalls, and drug usage audits.
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 ml-2" />
              </Link>

              <Link
                href="/recruitment"
                className="group flex items-center justify-between py-3 hover:bg-[#151519] px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                      Faction Recruitment Radar
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Scan active factionless players with 1-click personalized pitch letters.
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 ml-2" />
              </Link>

              <Link
                href="/travel"
                className="group flex items-center justify-between py-3 hover:bg-[#151519] px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      Safe-Landing Flight & Stock Radar
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        FREE
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Mug-defense arrival countdown alarms and live overseas stock checker.
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 ml-2" />
              </Link>

              <Link
                href="/pricing"
                className="group flex items-center justify-between py-3 hover:bg-[#151519] px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      100% Free Access & Roadmap
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        FREE
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      All 14 tactical tools, war heatmaps, and payout engines 100% free for everyone.
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Torn City Launchpad */}
      <div className="p-3.5 bg-[#0a0a0c] border border-[#1c1c1f] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="text-[11px] font-medium text-zinc-300">Torn Quick Links:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="https://www.torn.com/factions.php?step=your#/tab=armoury"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md bg-[#121215] hover:bg-[#1a1a1e] text-zinc-300 hover:text-white border border-[#222225] transition-colors text-[11px]"
          >
            Faction Armory
          </Link>
          <Link
            href="https://www.torn.com/hospitalview.php"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md bg-[#121215] hover:bg-[#1a1a1e] text-zinc-300 hover:text-white border border-[#222225] transition-colors text-[11px]"
          >
            Hospital
          </Link>
          <Link
            href="https://www.torn.com/travelagency.php"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md bg-[#121215] hover:bg-[#1a1a1e] text-zinc-300 hover:text-white border border-[#222225] transition-colors text-[11px]"
          >
            Travel Agency
          </Link>
          <Link
            href="https://www.torn.com/gym.php"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md bg-[#121215] hover:bg-[#1a1a1e] text-zinc-300 hover:text-white border border-[#222225] transition-colors text-[11px]"
          >
            Gym
          </Link>
          <Link
            href="https://www.torn.com/crimes.php"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md bg-[#121215] hover:bg-[#1a1a1e] text-zinc-300 hover:text-white border border-[#222225] transition-colors text-[11px]"
          >
            Crimes 2.0
          </Link>
        </div>
      </div>
    </div>
  );
}

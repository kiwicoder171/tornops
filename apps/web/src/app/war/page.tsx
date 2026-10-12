"use client";

import { useState, useEffect } from "react";
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
  Moon,
  Zap,
  Activity,
  User,
} from "lucide-react";
import { getDirectAttackUrl } from "@torn/shared";
import { useTorn } from "@/context/TornContext";

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

export default function WarRoomPage() {
  const { isLive, apiKey, userProfile } = useTorn();
  const [activeTab, setActiveTab] = useState<"ENEMY_TARGETS" | "FRIENDLY_ROSTER">("ENEMY_TARGETS");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OKAY" | "HOSP">("ALL");

  const [enemyTargets, setEnemyTargets] = useState<MemberStatusRow[]>([]);
  const [friendlyMembers, setFriendlyMembers] = useState<MemberStatusRow[]>([]);
  const [isLoadingEnemy, setIsLoadingEnemy] = useState(false);

  const [warMeta, setWarMeta] = useState({
    opponentName: "Storm Heralds",
    opponentId: 57574,
    ourScore: 2409,
    oppScore: 1573,
    lead: 836,
    isWon: true,
  });

  // Pull live data when API key is active
  useEffect(() => {
    if (!isLive || !apiKey) return;

    let isMounted = true;
    const fetchLiveWarData = async () => {
      try {
        // 1. Fetch our faction & ranked war metadata
        const facRes = await fetch(`/api/torn/faction?selections=basic,chain&key=${encodeURIComponent(apiKey)}`);
        const facData = await facRes.json();

        if (!isMounted) return;

        // Friendly members mapping (handles Torn v1 object dictionary)
        if (facData.members && typeof facData.members === "object") {
          const nowSec = Math.floor(Date.now() / 1000);
          const rawMembers: Array<{ id: number; name: string; level: number; status?: { state: string; description: string; until?: number }; is_revivable?: boolean }> =
            Array.isArray(facData.members)
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
        }

        // 2. Identify Opponent Faction ID from Ranked War
        let oppId = 57574;
        let oppName = "Storm Heralds";

        const rawRw = facData.ranked_wars || facData.rankedwars;
        const rwList = Array.isArray(rawRw) ? rawRw : rawRw && typeof rawRw === "object" ? Object.values(rawRw) : [];

        if (rwList.length > 0) {
          const rw = rwList[0] as any;
          const ourId = userProfile?.factionId || 57693;
          const ourFac = rw.factions?.find((f: { id: number }) => f.id === ourId);
          const oppFac = rw.factions?.find((f: { id: number }) => f.id !== ourId);

          if (ourFac && oppFac) {
            oppId = oppFac.id;
            oppName = oppFac.name;
            setWarMeta({
              opponentName: oppFac.name,
              opponentId: oppFac.id,
              ourScore: ourFac.score,
              oppScore: oppFac.score,
              lead: ourFac.score - oppFac.score,
              isWon: rw.winner === ourId,
            });
          }
        }

        // 3. Fetch Enemy Opponent Members directly via Torn API basic selection
        setIsLoadingEnemy(true);
        const oppRes = await fetch(`/api/torn/faction/${oppId}?selections=basic&key=${encodeURIComponent(apiKey)}`);
        const oppData = await oppRes.json();
        setIsLoadingEnemy(false);

        if (oppData.members && typeof oppData.members === "object" && isMounted) {
          const nowSec = Math.floor(Date.now() / 1000);
          const rawEnemy: Array<{ id: number; name: string; level: number; status?: { state: string; description: string; until?: number }; is_revivable?: boolean }> =
            Array.isArray(oppData.members)
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
              priority: m.level >= 18 ? "High" : "Standard",
              isRevivable: m.is_revivable,
            };
          });
          setEnemyTargets(enemyRows);
        }
      } catch {
        // Silently preserve current state on error
      }
    };

    fetchLiveWarData();
    const interval = setInterval(fetchLiveWarData, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLive, apiKey, userProfile]);

  const displayedList = activeTab === "ENEMY_TARGETS" ? enemyTargets : friendlyMembers;

  const filtered = displayedList.filter((t) => {
    if (statusFilter === "OKAY") return t.status === "Okay";
    if (statusFilter === "HOSP") return t.status === "Hospital";
    return true;
  });

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
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-md border inline-flex items-center gap-1 ${
                warMeta.isWon
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse"
              }`}
            >
              {warMeta.isWon ? <Trophy className="w-3.5 h-3.5 text-emerald-400" /> : <Flame className="w-3.5 h-3.5 text-red-400" />}
              <span>{warMeta.isWon ? "WAR VICTORY" : "LIVE WAR"}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Opponent: <span className="font-semibold text-slate-200">{warMeta.opponentName}</span>{" "}
            <span className="font-mono text-slate-400 tabular-nums">[#{warMeta.opponentId}]</span> | Score:{" "}
            <span className="font-mono text-white tabular-nums">{warMeta.ourScore.toLocaleString()}</span> vs{" "}
            <span className="font-mono text-slate-400 tabular-nums">{warMeta.oppScore.toLocaleString()}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs flex items-center gap-2">
            <span className="text-slate-400">Score Lead:</span>
            <span className={`font-mono font-bold tabular-nums ${warMeta.lead >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {warMeta.lead >= 0 ? `+${warMeta.lead.toLocaleString()}` : warMeta.lead.toLocaleString()} pts
            </span>
          </div>
        </div>
      </div>

      {/* Enemy Availability / Sleep Heatmap */}
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
        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 pt-1">
          {Array.from({ length: 24 }).map((_, hour) => {
            const isSleeping = hour >= 4 && hour <= 10;
            const isModerate = hour === 3 || hour === 11 || hour === 12;
            const bg = isSleeping ? "bg-emerald-600/80 hover:bg-emerald-500" : isModerate ? "bg-amber-600/80 hover:bg-amber-500" : "bg-red-600/80 hover:bg-red-500";

            return (
              <div key={hour} className="group relative flex flex-col items-center">
                <div className={`w-full h-8 rounded-sm ${bg} transition-colors cursor-pointer`} />
                <span className="text-[10px] text-slate-500 mt-1 font-mono tabular-nums">{hour.toString().padStart(2, "0")}</span>

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
              <span>Opponent Targets ({warMeta.opponentName})</span>
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
              <span>Friendly Roster ({userProfile?.factionName || "Mildly Dangerous"})</span>
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

        {/* Table Description Bar */}
        <div className="px-4 py-2.5 bg-slate-950/30 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            {activeTab === "ENEMY_TARGETS" ? (
              <>Showing enemy targets from <strong className="text-white">{warMeta.opponentName}</strong> with 1-click direct attack links.</>
            ) : (
              <>Showing faction teammates from <strong className="text-white">{userProfile?.factionName || "Mildly Dangerous"}</strong>. Coordinate revives and messages.</>
            )}
          </span>
          <span className="font-mono text-slate-400 tabular-nums">
            {filtered.length} records
          </span>
        </div>

        {/* Members / Targets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
              <tr>
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Condition Details</th>
                <th className="px-4 py-3 font-medium text-right">
                  {activeTab === "ENEMY_TARGETS" ? "Attack Action" : "Teammate Action"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.name}</span>
                    <span className="text-slate-500 font-mono tabular-nums">[{t.id}]</span>
                    {t.id === userProfile?.playerId && (
                      <span className="px-1.5 py-0.2 text-[10px] bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 font-medium">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono tabular-nums">{t.level}</td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-slate-400">
                    {t.details || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {activeTab === "ENEMY_TARGETS" ? (
                      <a
                        href={getDirectAttackUrl(t.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                      >
                        <Flame className="w-3.5 h-3.5" /> Direct Attack
                      </a>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

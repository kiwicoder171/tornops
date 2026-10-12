"use client";

import { useState, useEffect } from "react";
import { Calculator, Download, Copy, Check, Trophy, DollarSign, Activity, Users, Shield } from "lucide-react";
import { DEFAULT_PAYOUT_WEIGHTS } from "@torn/shared";
import { useTorn } from "@/context/TornContext";

interface WarMemberReport {
  id: number;
  name: string;
  attacks: number;
  score: number;
}

export default function PayoutCalculatorPage() {
  const { isLive, apiKey, userProfile } = useTorn();
  const [totalPool, setTotalPool] = useState<number>(100000000); // $100M reward pool
  const [copied, setCopied] = useState<boolean>(false);

  const [realMembers, setRealMembers] = useState<WarMemberReport[]>([
    { id: 4430788, name: "Eklatant", attacks: 221, score: 1015.76 },
    { id: 4072152, name: "kisagikun", attacks: 80, score: 319.99 },
    { id: 4158320, name: "Kakemannen", attacks: 53, score: 270.14 },
    { id: 4535577, name: "EvilBadger", attacks: 40, score: 254.39 },
    { id: 2869985, name: "RubberDuck3179", attacks: 45, score: 227.33 },
    { id: 4533671, name: "SpyLord67", attacks: 20, score: 124.32 },
    { id: 4437968, name: "tokof", attacks: 16, score: 85.89 },
    { id: 4107230, name: "Flame24667", attacks: 13, score: 69.81 },
    { id: 4533591, name: "Zom315", attacks: 3, score: 18.54 },
    { id: 4533906, name: "RustyDaggers", attacks: 3, score: 17.20 },
    { id: 4529441, name: "Nextactus", attacks: 1, score: 6.42 },
  ]);

  const [warMeta, setWarMeta] = useState({
    warId: 50506,
    opponentName: "Storm Heralds",
    ourRespectReward: 1663,
    cachesWon: ["1x Melee Cache", "1x Medium Arms Cache"],
  });

  // Pull live war report if connected
  useEffect(() => {
    if (!isLive || !apiKey) return;

    let isMounted = true;
    const fetchWarReport = async () => {
      try {
        const res = await fetch(`/api/torn/faction?id=50506&selections=rankedwarreport&key=${encodeURIComponent(apiKey)}`);
        const data = await res.json();

        if (!isMounted || !data.rankedwarreport) return;

        const report = data.rankedwarreport;
        const ourFac = report.factions?.find((f: { id: number }) => f.id === 57693);
        const oppFac = report.factions?.find((f: { id: number }) => f.id !== 57693);

        if (ourFac && Array.isArray(ourFac.members)) {
          const membersList = ourFac.members
            .filter((m: { attacks: number }) => m.attacks > 0)
            .sort((a: { attacks: number }, b: { attacks: number }) => b.attacks - a.attacks);

          setRealMembers(membersList);
          setWarMeta({
            warId: report.id || 50506,
            opponentName: oppFac?.name || "Storm Heralds",
            ourRespectReward: ourFac.rewards?.respect || 1663,
            cachesWon: ourFac.rewards?.items?.map((i: { quantity: number; name: string }) => `${i.quantity}x ${i.name}`) || [],
          });
        }
      } catch {
        // Retain current state
      }
    };

    fetchWarReport();
  }, [isLive, apiKey]);

  // Calculate payouts based on real attacks & war score
  const totalAttacks = realMembers.reduce((sum, m) => sum + m.attacks, 0);
  const totalScore = realMembers.reduce((sum, m) => sum + m.score, 0);

  // Compute member shares: 50% hits weight, 50% score/respect weight
  const payouts = realMembers.map((m) => {
    const hitShare = totalAttacks > 0 ? (m.attacks / totalAttacks) * 0.5 : 0;
    const scoreShare = totalScore > 0 ? (m.score / totalScore) * 0.5 : 0;
    const totalShare = hitShare + scoreShare;
    const finalPayout = Math.floor(totalPool * totalShare);

    return {
      playerId: m.id,
      playerName: m.name,
      attacks: m.attacks,
      score: Number(m.score.toFixed(2)),
      sharePct: Number((totalShare * 100).toFixed(2)),
      finalPayout,
    };
  });

  const handleCopyJson = () => {
    const payload: Record<string, number> = {};
    for (const p of payouts) {
      if (p.finalPayout > 0) payload[p.playerId.toString()] = p.finalPayout;
    }
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const headers = ["Player ID", "Player Name", "Attacks", "War Score", "Share (%)", "Payout ($)"];
    const rows = payouts.map((p) => [
      p.playerId,
      `"${p.playerName}"`,
      p.attacks,
      p.score,
      p.sharePct,
      p.finalPayout,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `war_${warMeta.warId}_payouts.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-500" />
              War Payout & Fair-Share Calculator
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md flex items-center gap-1 font-mono">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" /> War #{warMeta.warId} (Mildly Dangerous vs {warMeta.opponentName})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked War Report: <span className="text-white font-mono font-medium tabular-nums">{totalAttacks} total hits</span> landed | Rewards:{" "}
            <span className="text-emerald-400 font-mono font-medium tabular-nums">+{warMeta.ourRespectReward.toLocaleString()} Respect</span> & {warMeta.cachesWon.join(", ")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-800 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? "Copied JSON!" : "Copy Userscript JSON"}</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Formula Settings Panel */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-blue-400" />
          War Rewards Allocation Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="totalPool" className="text-xs text-slate-400 block mb-1 font-medium">Total Cash Reward Pool ($)</label>
            <input
              id="totalPool"
              name="totalPool"
              aria-label="Total Cash Reward Pool ($)"
              type="number"
              value={totalPool}
              onChange={(e) => setTotalPool(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Cash distributed from cache sales & faction bank</span>
          </div>

          <div>
            <label htmlFor="hitWeightRatio" className="text-xs text-slate-400 block mb-1 font-medium">Hit Weight Ratio</label>
            <input
              id="hitWeightRatio"
              name="hitWeightRatio"
              aria-label="Hit Weight Ratio"
              type="text"
              readOnly
              value="50% Hit Frequency / 50% War Score"
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Rewards both active hitters and high-stat anchors</span>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">Participating Hitters</label>
            <div className="text-lg font-bold text-white font-mono tabular-nums">
              {realMembers.length} Members
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Hitters qualified for reward pool</span>
          </div>
        </div>
      </div>

      {/* Live Payout Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Fair-Share Member Payout Breakdown</h3>
            <p className="text-xs text-slate-400">
              Ranked War #{warMeta.warId} Official Distribution
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Total Pool Allocated: </span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums">${totalPool.toLocaleString()}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
              <tr>
                <th className="px-4 py-3 font-medium">Fighter</th>
                <th className="px-4 py-3 font-medium">Attacks Landed</th>
                <th className="px-4 py-3 font-medium">War Score</th>
                <th className="px-4 py-3 font-medium">Pool Share (%)</th>
                <th className="px-4 py-3 font-medium text-right">Calculated Payout ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {payouts.map((m) => (
                <tr key={m.playerId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                    <span>{m.playerName}</span>
                    <span className="text-slate-500 font-mono tabular-nums">[{m.playerId}]</span>
                    {m.playerId === 4430788 && (
                      <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 font-medium">
                        Top Hitter
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-400 font-bold tabular-nums">{m.attacks} hits</td>
                  <td className="px-4 py-3 font-mono text-blue-400 font-medium tabular-nums">{m.score}</td>
                  <td className="px-4 py-3 font-mono text-slate-300 tabular-nums">{m.sharePct}%</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right tabular-nums">
                    ${m.finalPayout.toLocaleString()}
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

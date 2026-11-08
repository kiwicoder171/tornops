"use client";

import { useState } from "react";
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  Clock,
  CheckCircle,
  Lock,
  ShieldAlert,
  Send,
  AlertCircle,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";

interface WithdrawalItem {
  id: string;
  playerId: number;
  playerName: string;
  amount: number;
  reason: string;
  status: "PENDING" | "FULFILLED";
  requestedAt: string;
}

export default function BankingLedgerPage() {
  const { isLive, userProfile } = useTorn();
  const [requestedAmount, setRequestedAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [unlockedForTesting, setUnlockedForTesting] = useState(false);

  // Check if current user is leadership with AA
  const isLeader =
    userProfile?.isLeader ||
    userProfile?.isCoLeader ||
    userProfile?.hasAA ||
    userProfile?.position?.toLowerCase().includes("leader") ||
    userProfile?.position?.toLowerCase().includes("co-leader") ||
    unlockedForTesting ||
    false;

  const handleMemberRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedAmount) return;
    setRequestSubmitted(true);
    setTimeout(() => {
      setRequestSubmitted(false);
      setRequestedAmount("");
      setRequestReason("");
    }, 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Faction Vault & Banking Ledger</h1>
        <p className="text-sm text-slate-400 mt-1">
          Automated fundsnews deposit reconciliation and banker withdrawal fulfillment queue.
        </p>
      </div>

      {/* Restricted Access Card for Non-Leaders */}
      {isLive && !isLeader ? (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-amber-500/30 rounded-xl relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    🔒 Restricted Access: Faction Vault Ledger
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 font-semibold rounded border border-amber-500/30 uppercase">
                    AA Permission Required
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Torn City strictly restricts live faction vault ledger logs (<code className="text-amber-300 font-mono text-xs">fundsnews</code>) and batch cash transfer queues to <strong>Faction Leaders and Co-Leaders with Access Authority (AA)</strong>.
                </p>
                <div className="pt-2 text-xs text-slate-400 border-t border-slate-800 flex flex-wrap gap-4">
                  <span>
                    Your Identity: <strong className="text-white">{userProfile?.name}</strong> [{userProfile?.playerId}]
                  </span>
                  <span>
                    Faction: <strong className="text-white">{userProfile?.factionName || "Your Faction"}</strong>
                  </span>
                  <span>
                    Current Rank: <span className="text-amber-400 font-semibold">{userProfile?.position || "Recruit"}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 italic mt-1">
                  To view live faction deposits and approve batch transfers, connect with an API key from faction leadership with Access Authority (AA).
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setUnlockedForTesting(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Unlock Full Banker Suite (Faction Testing Mode)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Member Self-Service Withdrawal Form */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-xl">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" /> Submit Vault Withdrawal Request
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Submit a request to the faction banker queue for medical items, war equipment, or Xanax flights.
            </p>

            {requestSubmitted ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  Withdrawal request of <strong>${Number(requestedAmount).toLocaleString()}</strong> sent to Faction Banker queue!
                </span>
              </div>
            ) : (
              <form onSubmit={handleMemberRequest} className="space-y-4">
                <div>
                  <label htmlFor="withdrawAmount" className="text-xs font-medium text-slate-300 block mb-1">
                    Amount to Withdraw ($)
                  </label>
                  <input
                    id="withdrawAmount"
                    name="withdrawAmount"
                    aria-label="Amount to Withdraw ($)"
                    type="number"
                    placeholder="e.g. 5000000"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="withdrawReason" className="text-xs font-medium text-slate-300 block mb-1">
                    Reason for Withdrawal
                  </label>
                  <input
                    id="withdrawReason"
                    name="withdrawReason"
                    aria-label="Reason for Withdrawal"
                    type="text"
                    placeholder="e.g. War morphine restock / Flight funds"
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors"
                >
                  Submit to Banker Queue
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Full Banker View (Available for Leaders, Demo Mode, or Testing Unlock) */
        <div className="space-y-8">
          {unlockedForTesting && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Full Banker Suite Unlocked for Testing:</strong> You have full access to inspect vault metrics, withdrawal queues, and deposit logs.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUnlockedForTesting(false)}
                className="text-[11px] text-zinc-400 hover:text-white underline ml-3 shrink-0"
              >
                Reset to Member View
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Faction Vault Ledger</span>
                {!isLive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">DEMO</span>
                )}
              </div>
              <div className="mt-2 text-2xl font-bold text-white font-mono">
                {isLive ? "AA Key Required" : "$14,285,000,000"}
              </div>
              <span className="text-xs text-emerald-400 mt-1 block">
                {isLive ? "Requires Faction Leader AA key" : "Backed by Torn in-game vault"}
              </span>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Pending Withdrawals Queue</span>
                {!isLive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">DEMO</span>
                )}
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">
                {isLive ? "$0" : "$53,500,000"}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                {isLive ? "0 requests awaiting fulfillment" : "3 requests awaiting banker fulfillment"}
              </span>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">24h Deposit Influx</span>
                {!isLive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">DEMO</span>
                )}
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-400 font-mono">
                {isLive ? "--" : "+$175,000,000"}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                {isLive ? "Syncs with fundsnews on AA key" : "From fundsnews auto-sync"}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-xs text-slate-400">
            {isLive
              ? "Faction Vault batch transfers and fundsnews logs are restricted to leadership with Access Authority (AA)."
              : "Connect an Access Authority (AA) key from faction leadership to activate live batch transfer queues."}
          </div>
        </div>
      )}
    </div>
  );
}

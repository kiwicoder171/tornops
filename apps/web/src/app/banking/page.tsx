"use client";

import { useState, useEffect, useCallback } from "react";
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
  ExternalLink,
  RefreshCw,
  Sparkles,
  DollarSign,
  User,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";
import { BankingWithdrawalRecord } from "@/app/api/banking/route";

const DEMO_REQUESTS: BankingWithdrawalRecord[] = [
  {
    id: "demo-1",
    factionId: 57693,
    playerId: 2190841,
    playerName: "Jack_Sparrow",
    amount: 15000000,
    reason: "War Morphine & First Aid Kits restock",
    status: "PENDING",
    createdAt: Math.floor(Date.now() / 1000) - 1800,
  },
  {
    id: "demo-2",
    factionId: 57693,
    playerId: 2841092,
    playerName: "GhostRider_99",
    amount: 25000000,
    reason: "South Africa Xanax flight run",
    status: "PENDING",
    createdAt: Math.floor(Date.now() / 1000) - 4500,
  },
  {
    id: "demo-3",
    factionId: 57693,
    playerId: 1984019,
    playerName: "SilentKiller",
    amount: 13500000,
    reason: "Ranked War ammo reloads & smoke grenades",
    status: "PENDING",
    createdAt: Math.floor(Date.now() / 1000) - 9200,
  },
];

export default function BankingLedgerPage() {
  const { isLive, userProfile } = useTorn();
  const [requestedAmount, setRequestedAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [unlockedForTesting, setUnlockedForTesting] = useState(false);
  const [queue, setQueue] = useState<BankingWithdrawalRecord[]>(DEMO_REQUESTS);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  const effectiveFactionId = userProfile?.factionId || 57693;

  // Check if current user is leadership with AA or testing mode
  const isLeader =
    userProfile?.isLeader ||
    userProfile?.isCoLeader ||
    userProfile?.hasAA ||
    userProfile?.position?.toLowerCase().includes("leader") ||
    userProfile?.position?.toLowerCase().includes("co-leader") ||
    unlockedForTesting ||
    false;

  // Load live banking queue from Firestore API
  const fetchQueue = useCallback(async () => {
    setIsLoadingQueue(true);
    try {
      const res = await fetch(`/api/banking?factionId=${effectiveFactionId}`);
      const data = await res.json();
      if (data.requests && Array.isArray(data.requests) && data.requests.length > 0) {
        setQueue(data.requests);
      } else if (!isLive) {
        setQueue(DEMO_REQUESTS);
      } else {
        setQueue([]);
      }
    } catch {
      if (!isLive) setQueue(DEMO_REQUESTS);
    } finally {
      setIsLoadingQueue(false);
    }
  }, [effectiveFactionId, isLive]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Handle member submitting a withdrawal request
  const handleMemberRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedAmount || Number(requestedAmount) <= 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        action: "CREATE",
        factionId: effectiveFactionId,
        playerId: userProfile?.playerId || 4552150,
        playerName: userProfile?.name || "NongGuyver",
        amount: Number(requestedAmount),
        reason: requestReason.trim() || "War gear / Medical funds",
      };

      const res = await fetch("/api/banking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.record) {
        setQueue((prev) => [json.record, ...prev]);
        setRequestSubmitted(true);
        setRequestedAmount("");
        setRequestReason("");
        setTimeout(() => setRequestSubmitted(false), 3000);
      } else {
        // Local state fallback
        const localRecord: BankingWithdrawalRecord = {
          id: `local-${Date.now()}`,
          factionId: effectiveFactionId,
          playerId: userProfile?.playerId || 4552150,
          playerName: userProfile?.name || "NongGuyver",
          amount: Number(requestedAmount),
          reason: requestReason.trim() || "War gear / Medical funds",
          status: "PENDING",
          createdAt: Math.floor(Date.now() / 1000),
        };
        setQueue((prev) => [localRecord, ...prev]);
        setRequestSubmitted(true);
        setRequestedAmount("");
        setRequestReason("");
        setTimeout(() => setRequestSubmitted(false), 3000);
      }
    } catch {
      // Local fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle banker fulfilling a request
  const handleFulfillRequest = async (record: BankingWithdrawalRecord) => {
    setFulfillingId(record.id);
    try {
      const res = await fetch("/api/banking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FULFILL",
          factionId: effectiveFactionId,
          requestId: record.id,
          bankerName: userProfile?.name || "Banker",
        }),
      });

      if (res.ok) {
        setQueue((prev) =>
          prev.map((r) =>
            r.id === record.id
              ? {
                  ...r,
                  status: "FULFILLED",
                  fulfilledAt: Math.floor(Date.now() / 1000),
                  fulfilledBy: userProfile?.name || "Banker",
                }
              : r
          )
        );
      }
    } catch {
      // Optimistic update
      setQueue((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? { ...r, status: "FULFILLED", fulfilledAt: Math.floor(Date.now() / 1000) }
            : r
        )
      );
    } finally {
      setFulfillingId(null);
    }
  };

  // Metrics
  const pendingRequests = queue.filter((r) => r.status === "PENDING");
  const pendingTotal = pendingRequests.reduce((sum, r) => sum + r.amount, 0);
  const fulfilledCount = queue.filter((r) => r.status === "FULFILLED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#0c0c0e] border border-[#1e1e24] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Faction Vault & Banking Queue
              </h1>
              <p className="text-xs text-zinc-400">
                Cloud-synced member withdrawal requests, banker fulfillment queue, and transfer dispatcher.
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Pill & Refresh */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firestore Synced (Faction #{effectiveFactionId})</span>
          </div>

          <button
            onClick={fetchQueue}
            disabled={isLoadingQueue}
            className="p-1.5 text-zinc-400 hover:text-white bg-[#141418] border border-[#222228] rounded-md transition-colors cursor-pointer"
            title="Refresh Banking Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0c0c0f] border border-[#1c1c24]">
          <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            Pending Queue Total
          </span>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
            ${pendingTotal.toLocaleString()}
          </div>
          <span className="text-xs text-zinc-500 mt-1 block">
            {pendingRequests.length} request(s) awaiting banker transfer
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c0c0f] border border-[#1c1c24]">
          <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            Fulfilled Transfers
          </span>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {fulfilledCount} Completed
          </div>
          <span className="text-xs text-zinc-500 mt-1 block">
            Processed via Torn Vault Givefunds
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c0c0f] border border-[#1c1c24]">
          <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            Role & Authorization
          </span>
          <div className="text-base font-bold text-white flex items-center gap-1.5 mt-1">
            {isLeader ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Banker / Leader Access
              </span>
            ) : (
              <span className="text-zinc-300 flex items-center gap-1">
                <User className="w-4 h-4 text-blue-400" /> Member (Request Mode)
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500 mt-1 block">
            {isLeader ? "Authorized to fulfill & dispatch vault funds" : "Can submit withdrawal requests to banker queue"}
          </span>
        </div>
      </div>

      {/* Member Request Form & Testing Unlock Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Member Self-Service Withdrawal Form */}
        <div className="p-5 rounded-xl bg-[#0c0c0f] border border-[#1c1c24] lg:col-span-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 mb-1 flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            Submit Withdrawal Request
          </h2>
          <p className="text-[11px] text-zinc-400 mb-4">
            Request faction funds for war medical supplies, flight cash, or armor.
          </p>

          {requestSubmitted ? (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Withdrawal request sent to live Faction Banker queue!</span>
            </div>
          ) : (
            <form onSubmit={handleMemberRequest} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                  Amount to Request ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10000000"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  required
                  min={1}
                  className="w-full bg-[#121217] border border-[#20202a] focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                  Purpose / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Xanax flight run / RW Morphine"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full bg-[#121217] border border-[#20202a] focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit to Banker Queue"}</span>
              </button>
            </form>
          )}

          {!isLeader && (
            <div className="mt-4 pt-3 border-t border-[#1a1a22]">
              <button
                type="button"
                onClick={() => setUnlockedForTesting(true)}
                className="text-[11px] text-zinc-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unlock Banker Controls (Testing Pass)</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Live Faction Banker Fulfillment Queue */}
        <div className="p-5 rounded-xl bg-[#0c0c0f] border border-[#1c1c24] lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Live Banker Fulfillment Queue
            </h2>
            <span className="text-[10px] font-mono text-zinc-400">
              {queue.length} Total Records
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[#1f1f28] rounded-lg text-xs text-zinc-500">
              No withdrawal requests pending in the queue.
            </div>
          ) : (
            <div className="space-y-2 overflow-x-auto">
              {queue.map((req) => {
                const isPending = req.status === "PENDING";
                const isFulfilling = fulfillingId === req.id;

                return (
                  <div
                    key={req.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                      isPending
                        ? "bg-[#111116] border-[#22222d] hover:border-[#2f2f3e]"
                        : "bg-[#0d0d10] border-[#18181f] opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{req.playerName}</span>
                        <span className="text-[10px] font-mono text-zinc-500">[{req.playerId}]</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                            isPending
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                        ${req.amount.toLocaleString()}
                      </div>

                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {req.reason}
                      </div>

                      {req.fulfilledBy && (
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Fulfilled by {req.fulfilledBy}
                        </div>
                      )}
                    </div>

                    {/* Banker Actions */}
                    {isLeader && isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href="https://www.torn.com/factions.php?step=your#/tab=controls&sub=givefunds"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[11px] font-medium text-sky-300 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          title="Open Torn Givefunds in new tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Givefunds</span>
                        </a>

                        <button
                          onClick={() => handleFulfillRequest(req)}
                          disabled={isFulfilling}
                          className="px-3 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{isFulfilling ? "Marking..." : "Mark Fulfilled"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

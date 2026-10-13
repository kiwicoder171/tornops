"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Package,
  Pill,
  Clock,
  AlertTriangle,
  Search,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Users,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";

interface LoanedItem {
  id: string;
  memberName: string;
  memberId: number;
  itemName: string;
  category: "WEAPON" | "ARMOR" | "HAZMAT";
  loanDate: string;
  daysHeld: number;
  estimatedValue: string;
  isOverdue: boolean;
}

interface MedicalConsumption {
  memberId: number;
  memberName: string;
  warHits: number;
  xanaxTaken: number;
  bloodTaken: number;
  efficiencyScore: "OPTIMAL" | "BALANCED" | "HIGH CONSUMPTION" | "LEECH WARNING";
}

const mockLoans: LoanedItem[] = [
  {
    id: "LN-101",
    memberName: "Jack_Sparrow",
    memberId: 2190841,
    itemName: "Orange RW Macana (22% Powerful)",
    category: "WEAPON",
    loanDate: "2026-09-02",
    daysHeld: 40,
    estimatedValue: "$480,000,000",
    isOverdue: true,
  },
  {
    id: "LN-102",
    memberName: "GhostRider_99",
    memberId: 2841092,
    itemName: "Full Combat Armor Set (Quality 88%)",
    category: "ARMOR",
    loanDate: "2026-09-18",
    daysHeld: 24,
    estimatedValue: "$120,000,000",
    isOverdue: true,
  },
  {
    id: "LN-103",
    memberName: "SilentKiller",
    memberId: 1984019,
    itemName: "Hazmat Suit",
    category: "HAZMAT",
    loanDate: "2026-10-04",
    daysHeld: 8,
    estimatedValue: "$45,000,000",
    isOverdue: false,
  },
  {
    id: "LN-104",
    memberName: "Valkyrie_Tank",
    memberId: 3019284,
    itemName: "Yellow RW Armalite (18% Specialist)",
    category: "WEAPON",
    loanDate: "2026-10-06",
    daysHeld: 6,
    estimatedValue: "$210,000,000",
    isOverdue: false,
  },
];

const mockConsumptions: MedicalConsumption[] = [
  {
    memberId: 2190841,
    memberName: "Jack_Sparrow",
    warHits: 48,
    xanaxTaken: 4,
    bloodTaken: 12,
    efficiencyScore: "OPTIMAL",
  },
  {
    memberId: 2841092,
    memberName: "GhostRider_99",
    warHits: 36,
    xanaxTaken: 5,
    bloodTaken: 18,
    efficiencyScore: "BALANCED",
  },
  {
    memberId: 1984019,
    memberName: "SilentKiller",
    warHits: 12,
    xanaxTaken: 9,
    bloodTaken: 24,
    efficiencyScore: "HIGH CONSUMPTION",
  },
  {
    memberId: 3501924,
    memberName: "LazyBones_AFK",
    warHits: 2,
    xanaxTaken: 14,
    bloodTaken: 10,
    efficiencyScore: "LEECH WARNING",
  },
];

export default function ArmoryPage() {
  const { userProfile, isLive } = useTorn();
  const [activeTab, setActiveTab] = useState<"loans" | "consumption">("loans");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRecall, setSelectedRecall] = useState<LoanedItem | null>(null);
  const [copiedRecall, setCopiedRecall] = useState<boolean>(false);
  const [loans, setLoans] = useState<LoanedItem[]>(isLive ? [] : mockLoans);
  const [consumptions, setConsumptions] = useState<MedicalConsumption[]>(isLive ? [] : mockConsumptions);

  useEffect(() => {
    if (isLive) {
      setLoans([]);
      setConsumptions([]);
    } else {
      setLoans(mockLoans);
      setConsumptions(mockConsumptions);
    }
  }, [isLive]);

  const filteredLoans = loans.filter(
    (l) =>
      l.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.memberId.toString().includes(searchQuery)
  );

  const overdueCount = loans.filter((l) => l.isOverdue).length;
  const totalXanaxTaken = consumptions.reduce((sum, c) => sum + c.xanaxTaken, 0);

  const getRecallMessage = (loan: LoanedItem) => {
    return `Hey ${loan.memberName},

Our faction armory audit shows you have had the ${loan.itemName} checked out for ${loan.daysHeld} days.

We are preparing loadouts and armory allocations for our upcoming Ranked War. Please return the equipment to the faction armory controls as soon as you're online.

Return link: https://www.torn.com/factions.php?step=your#/tab=armoury
Thanks!`;
  };

  const handleCopyRecall = (loan: LoanedItem) => {
    navigator.clipboard.writeText(getRecallMessage(loan));
    setCopiedRecall(true);
    setTimeout(() => setCopiedRecall(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              FACTION VAULT • AUDITOR
            </span>
            <span className="text-xs text-zinc-400 font-mono">Real-time Loan Tracking</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <span>Armory & Loaner Item Tracker</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit high-value Ranked War weapons, combat armors, and medical usage. Detect overheld items and generate 1-click recall notices.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0d0d0f] border border-[#222225] p-1 rounded-lg text-xs font-mono">
          <button
            onClick={() => setActiveTab("loans")}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
              activeTab === "loans"
                ? "bg-emerald-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Loaned Equipment ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab("consumption")}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
              activeTab === "consumption"
                ? "bg-emerald-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Medical / Drug Audit
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-1">
            <span>LOANED ARMORY VALUE</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {loans.length > 0 ? "$855,000,000" : "$0"}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">{loans.length} active equipment loans</p>
        </div>

        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
          <div className="flex items-center justify-between text-xs text-amber-400 font-mono mb-1">
            <span>OVERDUE ITEMS (&gt;14 DAYS)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{overdueCount} Items</div>
          <p className="text-[11px] text-amber-300/80 mt-1">
            {overdueCount === 0 ? "Zero overdue equipment" : "Overdue for return to armory vault"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
          <div className="flex items-center justify-between text-xs text-purple-400 font-mono mb-1">
            <span>WAR XANAX BURN RATE</span>
            <Pill className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {totalXanaxTaken > 0 ? `${totalXanaxTaken} Used / War` : "0 Used"}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {totalXanaxTaken > 0 ? "Avg 0.34 Xanax taken per scored hit" : "Medical inventory stable"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
          <div className="flex items-center justify-between text-xs text-blue-400 font-mono mb-1">
            <span>ARMORY HEALTH</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {isLive ? (overdueCount === 0 ? "100% Secure" : "Audit Required") : "94% Accounted"}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">
            {overdueCount === 0 ? "Zero overdue items" : "Follow up on overdue items"}
          </p>
        </div>
      </div>

      {/* Main Content Sections */}
      {activeTab === "loans" ? (
        <div className="p-5 rounded-xl bg-[#0d0d0f] border border-[#222225] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1f1f23] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Active Loaned Weapons & Combat Armors</span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Track who holds faction items. Items held for over 14 days are flagged for recall.
              </p>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="armorySearch"
                name="armorySearch"
                aria-label="Search member or item"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member or item..."
                className="bg-black border border-[#27272a] pl-8 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-full"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#121215] text-[10px] font-mono text-zinc-400 uppercase tracking-wider border-b border-[#1f1f23]">
                <tr>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Equipment Item</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Est. Value</th>
                  <th className="py-2.5 px-3">Loan Duration</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Recall Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18181c] text-zinc-300">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-400" />
                      <div className="text-sm font-semibold text-white">No Active Loans</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        All faction armory items and loaner equipment are secured in the faction vault.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-[#141418] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{loan.memberName}</span>
                          <span className="text-[10px] font-mono text-zinc-500">[{loan.memberId}]</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-200">{loan.itemName}</td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#18181c] border border-[#27272a] text-zinc-300">
                          {loan.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-400 font-bold">{loan.estimatedValue}</td>
                      <td className="py-3 px-3 font-mono text-zinc-300">{loan.daysHeld} days</td>
                      <td className="py-3 px-3">
                        {loan.isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            OVERDUE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            ACTIVE LOAN
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedRecall(loan)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-[11px] font-bold transition-all"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Send Recall</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Medical Consumption Audit Tab */
        <div className="p-5 rounded-xl bg-[#0d0d0f] border border-[#222225] space-y-4">
          <div className="border-b border-[#1f1f23] pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-400" />
              <span>Ranked War Medical & Drug Consumption Audit</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Evaluates item withdrawal ratio against combat score. Flags members withdrawing excessive supplies without scoring hits.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#121215] text-[10px] font-mono text-zinc-400 uppercase tracking-wider border-b border-[#1f1f23]">
                <tr>
                  <th className="py-2.5 px-3">Faction Member</th>
                  <th className="py-2.5 px-3">War Hits Made</th>
                  <th className="py-2.5 px-3">Xanax Taken</th>
                  <th className="py-2.5 px-3">Blood Bags Taken</th>
                  <th className="py-2.5 px-3">Efficiency Rating</th>
                  <th className="py-2.5 px-3 text-right">Torn Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18181c] text-zinc-300">
                {consumptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                      <Pill className="w-8 h-8 mx-auto mb-2 opacity-50 text-purple-400" />
                      <div className="text-sm font-semibold text-white">No Medical Anomalies</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        No abnormal medical or Xanax consumption logs detected for this war cycle.
                      </div>
                    </td>
                  </tr>
                ) : (
                  consumptions.map((c) => (
                    <tr key={c.memberId} className="hover:bg-[#141418] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{c.memberName}</span>
                          <span className="text-[10px] font-mono text-zinc-500">[{c.memberId}]</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">{c.warHits} hits</td>
                      <td className="py-3 px-3 font-mono text-purple-300 font-bold">{c.xanaxTaken}x</td>
                      <td className="py-3 px-3 font-mono text-red-400 font-bold">{c.bloodTaken}x</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            c.efficiencyScore === "OPTIMAL"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : c.efficiencyScore === "BALANCED"
                              ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                              : c.efficiencyScore === "HIGH CONSUMPTION"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                          }`}
                        >
                          {c.efficiencyScore}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <a
                          href={`https://www.torn.com/profiles.php?XID=${c.memberId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recall Message Modal */}
      {selectedRecall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0f0f13] border border-[#2a2a32] rounded-xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222226] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Armory Equipment Recall Notice</span>
              </div>
              <button
                onClick={() => setSelectedRecall(null)}
                className="text-zinc-500 hover:text-white text-xs font-mono p-1"
              >
                ✕ Close
              </button>
            </div>

            <textarea
              readOnly
              rows={8}
              value={getRecallMessage(selectedRecall)}
              className="w-full bg-black border border-[#26262a] rounded-lg p-3 text-xs text-zinc-200 font-mono leading-relaxed resize-none focus:outline-none"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-zinc-400">
                Directs member to armory return tab.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleCopyRecall(selectedRecall)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedRecall ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRecall ? "Copied!" : "Copy Notice"}</span>
                </button>
                <a
                  href={`https://www.torn.com/messages.php#/p=compose&XID=${selectedRecall.memberId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-[#1c1c22] hover:bg-[#282830] text-zinc-200 border border-[#2e2e36] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Send on Torn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

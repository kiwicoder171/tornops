"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  Swords,
  Search,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Zap,
  Target,
  Sparkles,
  UserCheck,
  AlertTriangle,
  Clock,
  Layers,
  HelpCircle,
  Plus,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";

export interface RwItem {
  id: string;
  name: string;
  category: "PRIMARY" | "SECONDARY" | "MELEE" | "ARMOR";
  bonusName: string;
  bonusValue: string;
  bonusType: "DEBUFF" | "DAMAGE" | "UTILITY" | "ARMOR_SET";
  bonusDescription: string;
  tier: "ORANGE" | "YELLOW" | "RED";
  baseDamage?: number;
  baseAccuracy?: number;
  loanedTo?: {
    name: string;
    id: number;
    daysHeld: number;
    isOverdue: boolean;
  };
  valueEst: string;
}

const CANONICAL_RW_ARMORY: RwItem[] = [
  {
    id: "rw-1",
    name: "Enfield SA-80",
    category: "PRIMARY",
    bonusName: "Eviscerate",
    bonusValue: "24%",
    bonusType: "DEBUFF",
    bonusDescription: "Causes the target to take +24% more damage from all incoming hits for the next 3 turns.",
    tier: "ORANGE",
    baseDamage: 68.4,
    baseAccuracy: 58.2,
    loanedTo: {
      name: "WarStriker_X",
      id: 2841092,
      daysHeld: 18,
      isOverdue: true,
    },
    valueEst: "$1,250,000,000",
  },
  {
    id: "rw-2",
    name: "Armalite M-15A4",
    category: "PRIMARY",
    bonusName: "Powerful",
    bonusValue: "28%",
    bonusType: "DAMAGE",
    bonusDescription: "Provides +28% flat damage boost on all hits fired with this rifle.",
    tier: "ORANGE",
    baseDamage: 72.1,
    baseAccuracy: 61.5,
    loanedTo: {
      name: "Jack_Sparrow",
      id: 2190841,
      daysHeld: 6,
      isOverdue: false,
    },
    valueEst: "$1,850,000,000",
  },
  {
    id: "rw-3",
    name: "Macana",
    category: "MELEE",
    bonusName: "Revitalize",
    bonusValue: "20%",
    bonusType: "UTILITY",
    bonusDescription: "20% chance on damaging hit to restore 5 Energy immediately.",
    tier: "ORANGE",
    baseDamage: 65.2,
    baseAccuracy: 62.0,
    loanedTo: {
      name: "Valkyrie_Tank",
      id: 3019284,
      daysHeld: 4,
      isOverdue: false,
    },
    valueEst: "$950,000,000",
  },
  {
    id: "rw-4",
    name: "BT MP9",
    category: "SECONDARY",
    bonusName: "Expose",
    bonusValue: "22%",
    bonusType: "DEBUFF",
    bonusDescription: "Reduces target Defense by 22% for the duration of the fight.",
    tier: "YELLOW",
    baseDamage: 54.0,
    baseAccuracy: 64.1,
    loanedTo: {
      name: "SilentKiller",
      id: 1984019,
      daysHeld: 24,
      isOverdue: true,
    },
    valueEst: "$420,000,000",
  },
  {
    id: "rw-5",
    name: "Cobra Derringer",
    category: "SECONDARY",
    bonusName: "Paralyze",
    bonusValue: "18%",
    bonusType: "UTILITY",
    bonusDescription: "18% chance on hit to force the opponent to lose their turn completely.",
    tier: "YELLOW",
    baseDamage: 48.6,
    baseAccuracy: 55.4,
    valueEst: "$380,000,000",
  },
  {
    id: "rw-6",
    name: "Mag 7 Shotgun",
    category: "PRIMARY",
    bonusName: "Deadeye",
    bonusValue: "34%",
    bonusType: "DAMAGE",
    bonusDescription: "Deals +34% critical hit damage on neck and head shots.",
    tier: "ORANGE",
    baseDamage: 66.8,
    baseAccuracy: 52.4,
    valueEst: "$620,000,000",
  },
  {
    id: "rw-7",
    name: "Diamond Bludgeon",
    category: "MELEE",
    bonusName: "Plunder",
    bonusValue: "45%",
    bonusType: "UTILITY",
    bonusDescription: "Increases mug money yield by 45% when winning fight with this weapon.",
    tier: "YELLOW",
    baseDamage: 58.1,
    baseAccuracy: 56.7,
    loanedTo: {
      name: "BountyHunter_99",
      id: 2981014,
      daysHeld: 11,
      isOverdue: false,
    },
    valueEst: "$550,000,000",
  },
  {
    id: "rw-8",
    name: "Dune Combat Armor Set",
    category: "ARMOR",
    bonusName: "Dune Mitigation",
    bonusValue: "Quality 86%",
    bonusType: "ARMOR_SET",
    bonusDescription: "Provides high ballistic protection and +10% environmental hazard resistance in sandy terrain.",
    tier: "YELLOW",
    loanedTo: {
      name: "FrontlineBeast",
      id: 2109842,
      daysHeld: 32,
      isOverdue: true,
    },
    valueEst: "$340,000,000",
  },
  {
    id: "rw-9",
    name: "Hazmat Suit",
    category: "ARMOR",
    bonusName: "Toxin Immunity",
    bonusValue: "100%",
    bonusType: "ARMOR_SET",
    bonusDescription: "Guarantees complete immunity against toxic weapons, tear gas, and Pepper Spray debuffs.",
    tier: "YELLOW",
    valueEst: "$45,000,000",
  },
];

const STORAGE_RW_KEY = "TORN_ARMORY_RW_ITEMS";

export default function ArmoryPage() {
  const { userProfile, isLive } = useTorn();
  const [items, setItems] = useState<RwItem[]>(CANONICAL_RW_ARMORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterBonus, setFilterBonus] = useState<string>("ALL");
  const [filterLoanStatus, setFilterLoanStatus] = useState<"ALL" | "LOANED" | "AVAILABLE" | "OVERDUE">("ALL");
  const [selectedRecall, setSelectedRecall] = useState<RwItem | null>(null);
  const [copiedRecall, setCopiedRecall] = useState(false);

  // Restore custom armory items from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RW_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const filteredItems = items.filter((item) => {
    // Search query
    const matchSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bonusName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.loanedTo?.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchType = filterType === "ALL" || item.category === filterType;

    // Bonus Type filter
    const matchBonus = filterBonus === "ALL" || item.bonusType === filterBonus;

    // Loan status filter
    let matchLoan = true;
    if (filterLoanStatus === "LOANED") matchLoan = !!item.loanedTo;
    if (filterLoanStatus === "AVAILABLE") matchLoan = !item.loanedTo;
    if (filterLoanStatus === "OVERDUE") matchLoan = !!item.loanedTo?.isOverdue;

    return matchSearch && matchType && matchBonus && matchLoan;
  });

  const generateRecallMessage = (item: RwItem) => {
    if (!item.loanedTo) return "";
    return `Hi [${item.loanedTo.name}], friendly reminder from Faction Leadership: Please return the loaned [${item.name} (${item.bonusName} ${item.bonusValue})] back to the faction armory when possible. It has been on loan for ${item.loanedTo.daysHeld} days. Thank you!`;
  };

  const copyRecallMessage = (msg: string) => {
    navigator.clipboard.writeText(msg);
    setCopiedRecall(true);
    setTimeout(() => setCopiedRecall(false), 2500);
  };

  // Metrics
  const totalItems = items.length;
  const loanedCount = items.filter((i) => !!i.loanedTo).length;
  const overdueCount = items.filter((i) => !!i.loanedTo?.isOverdue).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#0c0c0e] border border-[#1e1e24] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Ranked War (RW) Weapon Vault & Armory
              </h1>
              <p className="text-xs text-zinc-400">
                Track high-tier Ranked War weapon bonuses (Eviscerate, Expose, Revitalize, Powerful) and manage active member loans.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-[#141418] border border-[#23232b] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-zinc-400">Total RW Assets:</span>
            <span className="font-mono font-bold text-white tabular-nums">{totalItems}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#141418] border border-[#23232b] flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">On Loan:</span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums">{loanedCount}</span>
          </div>
          {overdueCount > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-900/50 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-300 font-semibold">{overdueCount} Overdue Loans</span>
            </div>
          )}
        </div>
      </div>

      {/* Tactical RW Synergy Guide Banner */}
      <div className="p-4 rounded-xl bg-[#0e0e12] border border-[#1f1f26] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Recommended RW Attack Sequence for Maximum Hit Efficiency</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            1. Open with <span className="text-sky-300 font-semibold">Expose / Eviscerate</span> to shred enemy defenses → 2. Burst with <span className="text-red-300 font-semibold">Powerful / Deadeye</span> primary → 3. Finish or heal with <span className="text-emerald-300 font-semibold">Revitalize</span> melee to recover +5 Energy.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-[#0c0c0f] border border-[#1b1b22]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search weapon name, bonus (e.g. Eviscerate), or borrower..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121216] border border-[#202028] focus:border-red-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#121216] border border-[#202028] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Weapon Slots</option>
            <option value="PRIMARY">Primary Rifles</option>
            <option value="SECONDARY">Secondary Weapons</option>
            <option value="MELEE">Melee Weapons</option>
            <option value="ARMOR">Armor Sets</option>
          </select>

          {/* Bonus Type */}
          <select
            value={filterBonus}
            onChange={(e) => setFilterBonus(e.target.value)}
            className="bg-[#121216] border border-[#202028] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Bonus Types</option>
            <option value="DEBUFF">Debuffs (Eviscerate, Expose)</option>
            <option value="DAMAGE">Damage (Powerful, Deadeye)</option>
            <option value="UTILITY">Utility (Revitalize, Paralyze)</option>
            <option value="ARMOR_SET">Armor Mitigations</option>
          </select>

          {/* Loan Status */}
          <div className="inline-flex items-center rounded-lg bg-[#121216] border border-[#202028] p-0.5">
            {(["ALL", "AVAILABLE", "LOANED", "OVERDUE"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterLoanStatus(st)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                  filterLoanStatus === st
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RW Weapon Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isLoaned = !!item.loanedTo;
          const isOverdue = !!item.loanedTo?.isOverdue;

          return (
            <div
              key={item.id}
              className={`rounded-xl p-4 border flex flex-col justify-between transition-all ${
                isOverdue
                  ? "bg-red-950/10 border-red-900/40"
                  : "bg-[#0c0c0f] border-[#1c1c24] hover:border-[#2b2b36]"
              }`}
            >
              <div>
                {/* Card Top: Slot & Tier Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#181820] text-zinc-300 border border-[#262632]">
                      {item.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        item.tier === "ORANGE"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : item.tier === "RED"
                          ? "bg-red-500/15 text-red-300 border border-red-500/30"
                          : "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30"
                      }`}
                    >
                      {item.tier}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-semibold text-zinc-400">
                    {item.valueEst}
                  </span>
                </div>

                {/* Weapon Name */}
                <h3 className="text-sm font-bold text-white mb-2">{item.name}</h3>

                {/* Highlighted RW Bonus Banner */}
                <div className="p-2.5 rounded-lg bg-[#121217] border border-[#22222c] mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {item.bonusName}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.2 rounded">
                      +{item.bonusValue}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {item.bonusDescription}
                  </p>
                </div>

                {/* Weapon Combat Stats (if available) */}
                {item.baseDamage && (
                  <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3 font-mono">
                    <div className="p-1.5 rounded bg-[#101014] border border-[#1e1e26]">
                      <span className="text-[10px] text-zinc-500 block">DAMAGE</span>
                      <span className="font-bold text-white tabular-nums">{item.baseDamage}</span>
                    </div>
                    <div className="p-1.5 rounded bg-[#101014] border border-[#1e1e26]">
                      <span className="text-[10px] text-zinc-500 block">ACCURACY</span>
                      <span className="font-bold text-white tabular-nums">{item.baseAccuracy}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Loan Status & Recall Action */}
              <div className="pt-3 border-t border-[#181820]">
                {isLoaned ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-white font-medium truncate">{item.loanedTo?.name}</span>
                        <span className="text-zinc-500 text-[10px] font-mono">[{item.loanedTo?.id}]</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                          isOverdue
                            ? "bg-red-950/40 text-red-400 border border-red-800/40 animate-pulse"
                            : "bg-[#16161c] text-zinc-400 border border-[#24242e]"
                        }`}
                      >
                        {item.loanedTo?.daysHeld}d held
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedRecall(item)}
                      className="w-full py-1.5 text-[11px] font-medium text-zinc-300 hover:text-white bg-[#15151c] hover:bg-[#1d1d27] border border-[#242430] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-sky-400" />
                      <span>Generate Recall Message</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Available in Armory
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Ready to Loan</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recall Message Modal */}
      {selectedRecall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-5 rounded-xl bg-[#0e0e12] border border-[#282835] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#20202a]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Armory Recall Dispatcher
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecall(null)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 font-medium">
                Copy and paste this message into Torn Chat or Discord to recall the asset:
              </label>
              <textarea
                readOnly
                rows={4}
                value={generateRecallMessage(selectedRecall)}
                className="w-full bg-[#14141a] border border-[#252532] rounded-lg p-3 text-xs text-zinc-200 font-mono focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={`https://www.torn.com/messages.php#/p=compose&XID=${selectedRecall.loanedTo?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Direct Torn Message</span>
              </a>

              <button
                onClick={() => copyRecallMessage(generateRecallMessage(selectedRecall))}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedRecall ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Recall Message</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

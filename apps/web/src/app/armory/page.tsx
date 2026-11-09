"use client";

import { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  Trash2,
  X,
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
  } | null;
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
      name: "Sample_Borrower_1",
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
      name: "Sample_Borrower_2",
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
    loanedTo: null,
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
    loanedTo: null,
    valueEst: "$420,000,000",
  },
];

export default function ArmoryPage() {
  const { userProfile, isLive, isHydrated } = useTorn();
  const [items, setItems] = useState<RwItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterBonus, setFilterBonus] = useState<string>("ALL");
  const [filterLoanStatus, setFilterLoanStatus] = useState<"ALL" | "LOANED" | "AVAILABLE" | "OVERDUE">("ALL");
  const [selectedRecall, setSelectedRecall] = useState<RwItem | null>(null);
  const [copiedRecall, setCopiedRecall] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Weapon Form State
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<"PRIMARY" | "SECONDARY" | "MELEE" | "ARMOR">("PRIMARY");
  const [newBonusName, setNewBonusName] = useState("Eviscerate");
  const [newBonusValue, setNewBonusValue] = useState("20%");
  const [newTier, setNewTier] = useState<"ORANGE" | "YELLOW" | "RED">("YELLOW");
  const [newBorrowerName, setNewBorrowerName] = useState("");
  const [newBorrowerId, setNewBorrowerId] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const effectiveFactionId = userProfile?.factionId || 57693;

  // Fetch real items from Firestore when live
  const fetchArmoryItems = useCallback(async () => {
    if (!isHydrated) return;

    if (!isLive) {
      setItems(CANONICAL_RW_ARMORY);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/armory?factionId=${effectiveFactionId}`);
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveFactionId, isLive, isHydrated]);

  useEffect(() => {
    fetchArmoryItems();
  }, [fetchArmoryItems]);

  const handleRegisterWeapon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newBonusName.trim()) return;

    setIsSubmittingNew(true);
    const loanedTo =
      newBorrowerName.trim() && newBorrowerId.trim()
        ? {
            name: newBorrowerName.trim(),
            id: Number(newBorrowerId),
            daysHeld: 1,
            isOverdue: false,
          }
        : null;

    try {
      const res = await fetch("/api/armory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          factionId: effectiveFactionId,
          name: newName.trim(),
          category: newCategory,
          bonusName: newBonusName.trim(),
          bonusValue: newBonusValue.trim(),
          bonusType: ["Eviscerate", "Expose", "Wither", "Slow"].includes(newBonusName) ? "DEBUFF" : "DAMAGE",
          bonusDescription: `${newBonusName} +${newBonusValue} tactical ranked war bonus.`,
          tier: newTier,
          loanedTo,
          valueEst: "$250,000,000",
        }),
      });

      const json = await res.json();
      if (json.success && json.record) {
        setItems((prev) => [json.record, ...prev]);
      } else {
        // Optimistic local add
        const localItem: RwItem = {
          id: `local-${Date.now()}`,
          name: newName.trim(),
          category: newCategory,
          bonusName: newBonusName.trim(),
          bonusValue: newBonusValue.trim(),
          bonusType: "DAMAGE",
          bonusDescription: `${newBonusName} +${newBonusValue} combat bonus.`,
          tier: newTier,
          loanedTo,
          valueEst: "$250,000,000",
        };
        setItems((prev) => [localItem, ...prev]);
      }

      setShowAddModal(false);
      setNewName("");
      setNewBorrowerName("");
      setNewBorrowerId("");
    } catch {
      // Retain
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bonusName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.loanedTo && item.loanedTo.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType = filterType === "ALL" || item.category === filterType;
    const matchBonus = filterBonus === "ALL" || item.bonusType === filterBonus;

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

        {/* Action Controls & Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {isLive ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Armory (#{effectiveFactionId})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
              <span>DEMO MODE (Sample Arsenal)</span>
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register RW Weapon</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="px-3 py-1.5 rounded-lg bg-[#141418] border border-[#23232b] flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-zinc-400">Total Registered RW Assets:</span>
          <span className="font-mono font-bold text-white tabular-nums">{totalItems}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-[#141418] border border-[#23232b] flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-zinc-400">Currently On Loan:</span>
          <span className="font-mono font-bold text-emerald-400 tabular-nums">{loanedCount}</span>
        </div>
        {overdueCount > 0 && (
          <div className="px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-900/50 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-300 font-semibold">{overdueCount} Overdue Loans</span>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-[#0c0c0f] border border-[#1b1b22]">
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

        <div className="flex flex-wrap items-center gap-2 text-xs">
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

      {/* Main Content: Loading / Empty State / Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-zinc-500 font-mono flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
          <span>Syncing Faction RW Armory with Cloud...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-10 rounded-xl bg-[#0c0c0f] border border-dashed border-[#1f1f28] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No Ranked War Weapons Registered Yet</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              {isLive
                ? "Torn Public API keys cannot read faction in-game vaults directly. Register your faction's high-tier RW weapons to track active loaners, overdue returns, and combat bonus loadouts!"
                : "No items match your active search filters."}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register First RW Weapon</span>
          </button>
        </div>
      ) : (
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

                  <h3 className="text-sm font-bold text-white mb-2">{item.name}</h3>

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
                </div>

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
      )}

      {/* Register RW Weapon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-5 rounded-xl bg-[#0e0e12] border border-[#282835] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#20202a]">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-white">Register RW Weapon to Faction Vault</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleRegisterWeapon} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-300 block mb-1">Weapon Name</label>
                <input
                  type="text"
                  placeholder="e.g. Enfield SA-80, ArmaLite M-15A4, Macana"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full bg-[#14141a] border border-[#252532] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-zinc-300 block mb-1">Slot</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#14141a] border border-[#252532] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="PRIMARY">Primary</option>
                    <option value="SECONDARY">Secondary</option>
                    <option value="MELEE">Melee</option>
                    <option value="ARMOR">Armor</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-300 block mb-1">RW Bonus</label>
                  <input
                    type="text"
                    placeholder="e.g. Eviscerate"
                    value={newBonusName}
                    onChange={(e) => setNewBonusName(e.target.value)}
                    required
                    className="w-full bg-[#14141a] border border-[#252532] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-300 block mb-1">Bonus %</label>
                  <input
                    type="text"
                    placeholder="e.g. 24%"
                    value={newBonusValue}
                    onChange={(e) => setNewBonusValue(e.target.value)}
                    required
                    className="w-full bg-[#14141a] border border-[#252532] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#1c1c24]">
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">Currently on Loan? (Optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Borrower Member Name"
                    value={newBorrowerName}
                    onChange={(e) => setNewBorrowerName(e.target.value)}
                    className="bg-[#14141a] border border-[#252532] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Borrower Player ID"
                    value={newBorrowerId}
                    onChange={(e) => setNewBorrowerId(e.target.value)}
                    className="bg-[#14141a] border border-[#252532] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {isSubmittingNew ? "Saving..." : "Save to Faction Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recall Message Modal */}
      {selectedRecall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-5 rounded-xl bg-[#0e0e12] border border-[#282835] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#20202a]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Armory Recall Dispatcher</h3>
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

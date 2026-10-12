"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HeartPulse,
  Flame,
  Clock,
  ShieldAlert,
  Coins,
  CheckCircle2,
  ExternalLink,
  Plus,
  Copy,
  AlertTriangle,
  Users,
  Search,
  Filter,
  Volume2,
  VolumeX,
} from "lucide-react";

interface HospitalPatient {
  id: number;
  name: string;
  role: string;
  hospitalReason: string;
  minutesRemaining: number;
  priority: "CRITICAL" | "HIGH" | "NORMAL";
  chance: number; // Revive success probability %
  energyCost: number; // 25e (with perk) or 75e
  assignedReviver?: string;
  status: "WAITING" | "DISPATCHED" | "REVIVED";
  requestedAt: string;
}

interface ReviverContract {
  id: number;
  name: string;
  tornId: number;
  skillLevel: string; // e.g. "Skill 100 / 75e"
  ratePerRevive: "1 Xanax" | "$1,000,000";
  revivesCompleted: number;
  status: "ONLINE" | "RESTING" | "OFFLINE";
  paid: boolean;
}

const INITIAL_PATIENTS: HospitalPatient[] = [
  {
    id: 2841029,
    name: "ApexPredator",
    role: "Lead War Hitter (Chain #99)",
    hospitalReason: "Hospitalized by Storm Heralds (RPG-7 blast)",
    minutesRemaining: 184,
    priority: "CRITICAL",
    chance: 94,
    energyCost: 25,
    status: "WAITING",
    requestedAt: "45s ago",
  },
  {
    id: 1982034,
    name: "IronClad",
    role: "Heavy Defender",
    hospitalReason: "Hospitalized by Storm Heralds (ArmaLite M-15)",
    minutesRemaining: 142,
    priority: "HIGH",
    chance: 88,
    energyCost: 25,
    status: "WAITING",
    requestedAt: "2m ago",
  },
  {
    id: 3012948,
    name: "ShadowSniper",
    role: "Assault Striker",
    hospitalReason: "Overdosed on Xanax (-90% stats)",
    minutesRemaining: 310,
    priority: "HIGH",
    chance: 76,
    energyCost: 25,
    status: "DISPATCHED",
    assignedReviver: "DocHoliday [219842]",
    requestedAt: "5m ago",
  },
  {
    id: 2490192,
    name: "GhostRider",
    role: "Regular Member",
    hospitalReason: "Mugged in South Africa",
    minutesRemaining: 65,
    priority: "NORMAL",
    chance: 98,
    energyCost: 25,
    status: "WAITING",
    requestedAt: "12m ago",
  },
  {
    id: 2187345,
    name: "ViperStrike",
    role: "Chain Retaliator",
    hospitalReason: "Hospitalized by Storm Heralds (Clubbed)",
    minutesRemaining: 95,
    priority: "CRITICAL",
    chance: 91,
    energyCost: 25,
    status: "REVIVED",
    assignedReviver: "ReviveMedic [1849102]",
    requestedAt: "18m ago",
  },
];

const INITIAL_REVIVERS: ReviverContract[] = [
  {
    id: 1,
    name: "DocHoliday",
    tornId: 219842,
    skillLevel: "Skill 100 • 25e Perks",
    ratePerRevive: "1 Xanax",
    revivesCompleted: 14,
    status: "ONLINE",
    paid: false,
  },
  {
    id: 2,
    name: "ReviveMedic",
    tornId: 1849102,
    skillLevel: "Skill 92 • 25e Perks",
    ratePerRevive: "1 Xanax",
    revivesCompleted: 9,
    status: "ONLINE",
    paid: false,
  },
  {
    id: 3,
    name: "AngelWings",
    tornId: 904123,
    skillLevel: "Skill 85 • 75e Standard",
    ratePerRevive: "$1,000,000",
    revivesCompleted: 6,
    status: "RESTING",
    paid: true,
  },
];

export default function ReviveDispatchPage() {
  const [patients, setPatients] = useState<HospitalPatient[]>(INITIAL_PATIENTS);
  const [revivers, setRevivers] = useState<ReviverContract[]>(INITIAL_REVIVERS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "revivers" | "payouts">("queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Request Revive Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newRequestName, setNewRequestName] = useState("");
  const [newRequestId, setNewRequestId] = useState("");
  const [newRequestPriority, setNewRequestPriority] = useState<"CRITICAL" | "HIGH" | "NORMAL">("HIGH");
  const [newRequestReason, setNewRequestReason] = useState("");

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleMarkRevived = (patientId: number) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return { ...p, status: "REVIVED" };
        }
        return p;
      })
    );
    // Attribute to first online reviver
    setRevivers((prev) =>
      prev.map((r, i) => (i === 0 ? { ...r, revivesCompleted: r.revivesCompleted + 1 } : r))
    );
  };

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestName.trim() || !newRequestId.trim()) return;

    const newPatient: HospitalPatient = {
      id: parseInt(newRequestId, 10) || Math.floor(Math.random() * 900000) + 1000000,
      name: newRequestName.trim(),
      role: newRequestPriority === "CRITICAL" ? "Chain Hitter (Urgent)" : "War Fighter",
      hospitalReason: newRequestReason.trim() || "Ranked War Casualty",
      minutesRemaining: 180,
      priority: newRequestPriority,
      chance: 92,
      energyCost: 25,
      status: "WAITING",
      requestedAt: "Just now",
    };

    setPatients([newPatient, ...patients]);
    setShowRequestModal(false);
    setNewRequestName("");
    setNewRequestId("");
    setNewRequestReason("");
  };

  const waitingCount = patients.filter((p) => p.status === "WAITING").length;
  const criticalCount = patients.filter((p) => p.priority === "CRITICAL" && p.status !== "REVIVED").length;
  const totalRevivesLogged = revivers.reduce((sum, r) => sum + r.revivesCompleted, 0);
  const unpaidXanax = revivers
    .filter((r) => !r.paid && r.ratePerRevive === "1 Xanax")
    .reduce((sum, r) => sum + r.revivesCompleted, 0);

  const filteredPatients = patients.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toString().includes(searchQuery) ||
      p.hospitalReason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222225] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  War Revive Dispatch Board
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                  LIVE HOSP QUEUE
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Real-time faction hospital triage, 1-click reviver dispatch links, and automated Xanax ledger.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? "bg-[#141416] border-[#27272a] text-white hover:border-[#3f3f46]"
                : "bg-[#0d0d0f] border-[#222225] text-[#71717a]"
            }`}
            title="Toggle audible siren on new critical hospitalized casualty"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Alerts On
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                Alerts Muted
              </>
            )}
          </button>

          <button
            onClick={() => setShowRequestModal(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Request Priority Revive
          </button>
        </div>
      </div>

      {/* Triage Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
          <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-1">
            <span>In Hospital Waiting</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{waitingCount}</div>
          <div className="text-[11px] text-amber-400/90 mt-1">
            {criticalCount} Critical Chain Hitters
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
          <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-1">
            <span>Active Contract Revivers</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {revivers.filter((r) => r.status === "ONLINE").length} / {revivers.length}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Ready for 25e Perks</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
          <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-1">
            <span>War Revives Dispatched</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalRevivesLogged}</div>
          <div className="text-[11px] text-[#71717a] mt-1">Current Ranked War total</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
          <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-1">
            <span>Unsettled Reviver Ledger</span>
            <Coins className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">{unpaidXanax} Xanax</div>
          <div className="text-[11px] text-[#71717a] mt-1">≈ ${(unpaidXanax * 0.83).toFixed(1)}M Torn cash</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-[#222225] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "queue"
                ? "bg-[#1f1f23] text-white border border-[#3f3f46]"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-red-400" />
            Hospital Triage Queue ({patients.length})
          </button>
          <button
            onClick={() => setActiveTab("revivers")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "revivers"
                ? "bg-[#1f1f23] text-white border border-[#3f3f46]"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Contracted Revivers ({revivers.length})
          </button>
          <button
            onClick={() => setActiveTab("payouts")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "payouts"
                ? "bg-[#1f1f23] text-white border border-[#3f3f46]"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            Payout Ledger
          </button>
        </div>

        {activeTab === "queue" && (
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="reviveSearch"
              name="reviveSearch"
              aria-label="Search member or casualty"
              type="text"
              placeholder="Search member or casualty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-[#141416] border border-[#27272a] rounded-lg text-white placeholder-[#71717a] focus:outline-none focus:border-red-500"
            />
          </div>
        )}
      </div>

      {/* Tab Content 1: Triage Queue */}
      {activeTab === "queue" && (
        <div className="space-y-3">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 bg-[#0d0d0f] rounded-xl border border-[#222225]">
              <HeartPulse className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-semibold text-white">All Clear! Hospital Queue Empty</div>
              <p className="text-xs text-[#71717a] mt-1">No faction members are currently awaiting revives.</p>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const tornProfileUrl = `https://www.torn.com/profiles.php?XID=${patient.id}#revive`;
              const isUrgent = patient.priority === "CRITICAL";

              return (
                <div
                  key={patient.id}
                  className={`p-4 rounded-xl border transition-all ${
                    patient.status === "REVIVED"
                      ? "bg-[#0d0d0f]/60 border-[#222225] opacity-60"
                      : isUrgent
                      ? "bg-red-950/20 border-red-500/40 shadow-lg shadow-red-950/30"
                      : "bg-[#0d0d0f] border-[#222225] hover:border-[#333338]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Patient Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={tornProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-white hover:text-red-400 transition-colors flex items-center gap-1.5"
                        >
                          {patient.name}
                          <span className="text-xs text-[#71717a]">[{patient.id}]</span>
                          <ExternalLink className="w-3 h-3 text-[#71717a]" />
                        </Link>

                        {/* Priority Badge */}
                        {patient.priority === "CRITICAL" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                            CRITICAL CHAIN HITTER
                          </span>
                        )}
                        {patient.priority === "HIGH" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            HIGH PRIORITY
                          </span>
                        )}
                        {patient.priority === "NORMAL" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#222225] text-[#a1a1aa]">
                            NORMAL
                          </span>
                        )}

                        {/* Status Badge */}
                        {patient.status === "REVIVED" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            REVIVED
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#a1a1aa] flex flex-wrap items-center gap-3">
                        <span className="text-red-300/80">{patient.hospitalReason}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[#71717a]">
                          <Clock className="w-3 h-3" />
                          {Math.floor(patient.minutesRemaining / 60)}h {patient.minutesRemaining % 60}m left
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400 font-mono text-[11px]">
                          {patient.chance}% Revive Chance
                        </span>
                        <span>•</span>
                        <span className="text-[#71717a]">Requested {patient.requestedAt}</span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {patient.status !== "REVIVED" ? (
                        <>
                          <Link
                            href={tornProfileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-red-950/40"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            1-Click Revive (Torn)
                          </Link>

                          <button
                            onClick={() => handleMarkRevived(patient.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#141416] hover:bg-[#1f1f23] text-emerald-400 border border-[#27272a] hover:border-emerald-500/40 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Revived
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-[#71717a] italic">
                          Revived by {patient.assignedReviver || "Contract Reviver"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content 2: Contracted Revivers */}
      {activeTab === "revivers" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225] text-xs text-[#a1a1aa] flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">How Revive Contracts Work:</span> Hired revivers use 25 energy per revive with faction perks. We log every revive delivered during Ranked Wars and generate a one-click settlement command for your faction vault.
            </div>
            <span className="text-purple-400 font-mono font-semibold">Standard Rate: 1 Xanax / Revive</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {revivers.map((reviver) => (
              <div
                key={reviver.id}
                className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225] flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      {reviver.name}
                      <span className="text-xs text-[#71717a]">[{reviver.tornId}]</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        reviver.status === "ONLINE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-[#222225] text-[#71717a]"
                      }`}
                    >
                      {reviver.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#71717a]">{reviver.skillLevel}</div>

                  <div className="mt-4 pt-3 border-t border-[#1f1f23] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#71717a]">Hits Delivered</div>
                      <div className="text-lg font-bold text-white">{reviver.revivesCompleted}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-[#71717a]">Contract Rate</div>
                      <div className="text-xs font-semibold text-purple-400">{reviver.ratePerRevive}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`https://www.torn.com/profiles.php?XID=${reviver.tornId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-medium bg-[#141416] hover:bg-[#1a1a1d] text-white border border-[#27272a] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-[#71717a]" />
                    View Reviver Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 3: Payout Ledger */}
      {activeTab === "payouts" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225]">
            <h3 className="text-sm font-semibold text-white mb-2">Automated Reviver Settlement Ledger</h3>
            <p className="text-xs text-[#a1a1aa] mb-4">
              Copy the batch payment command to transfer Xanax or cash directly from your Faction Vault.
            </p>

            <div className="space-y-3">
              {revivers.map((reviver) => {
                const totalOwedText =
                  reviver.ratePerRevive === "1 Xanax"
                    ? `${reviver.revivesCompleted}x Xanax`
                    : `$${(reviver.revivesCompleted * 1000000).toLocaleString()}`;

                const transferMemo = `War Revive Payout: ${reviver.revivesCompleted} hits delivered to Mildly Dangerous`;

                return (
                  <div
                    key={reviver.id}
                    className="p-3.5 rounded-lg bg-[#141416] border border-[#27272a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        {reviver.name} [{reviver.tornId}]
                        {reviver.paid ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            SETTLED
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            OWED: {totalOwedText}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#71717a] mt-0.5">
                        {reviver.revivesCompleted} verified revives @ {reviver.ratePerRevive}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleCopy(
                            `Send ${totalOwedText} to ${reviver.name} [${reviver.tornId}] - Memo: ${transferMemo}`,
                            `reviver-${reviver.id}`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1f1f23] hover:bg-[#27272a] text-white border border-[#333338] flex items-center gap-1.5 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#a1a1aa]" />
                        {copiedText === `reviver-${reviver.id}` ? "Copied!" : "Copy Vault Memo"}
                      </button>

                      <Link
                        href={`https://www.torn.com/factions.php?step=your#/tab=armoury`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 transition-all"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        Send from Vault
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Priority Revive */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0d0d0f] border border-[#27272a] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Request Priority Revive</h3>
                <p className="text-xs text-[#a1a1aa]">Dispatch a contracted reviver immediately to your profile.</p>
              </div>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label htmlFor="newRequestName" className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Member In-Game Name
                </label>
                <input
                  id="newRequestName"
                  name="newRequestName"
                  type="text"
                  required
                  placeholder="e.g. ShadowSniper"
                  value={newRequestName}
                  onChange={(e) => setNewRequestName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#141416] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label htmlFor="newRequestId" className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Torn Player ID (XID)
                </label>
                <input
                  id="newRequestId"
                  name="newRequestId"
                  type="number"
                  required
                  placeholder="e.g. 2841029"
                  value={newRequestId}
                  onChange={(e) => setNewRequestId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#141416] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["CRITICAL", "HIGH", "NORMAL"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewRequestPriority(p)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        newRequestPriority === p
                          ? p === "CRITICAL"
                            ? "bg-red-500/20 text-red-400 border-red-500"
                            : p === "HIGH"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500"
                            : "bg-[#222225] text-white border-[#3f3f46]"
                          : "bg-[#141416] border-[#27272a] text-[#71717a]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="newRequestReason" className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Hospital Reason / Note
                </label>
                <input
                  id="newRequestReason"
                  name="newRequestReason"
                  type="text"
                  placeholder="e.g. Retaliating on enemy #1, chain at 1:40!"
                  value={newRequestReason}
                  onChange={(e) => setNewRequestReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#141416] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222225]">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#a1a1aa] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white"
                >
                  Add to Dispatch Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

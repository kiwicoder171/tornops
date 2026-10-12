"use client";

import { useState } from "react";
import {
  UserPlus,
  Search,
  Filter,
  Copy,
  ExternalLink,
  MessageSquare,
  Shield,
  Zap,
  Check,
  Star,
  Users,
  Award,
  Clock,
  Sparkles,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";

interface Candidate {
  id: number;
  name: string;
  level: number;
  age: number; // days
  attacksWon: number;
  lastAction: string;
  activityStatus: "ONLINE" | "ACTIVE (15M AGO)" | "ACTIVE (1H AGO)";
  statTier: string;
  job: string;
  isFactionless: boolean;
}

const mockCandidates: Candidate[] = [
  {
    id: 3412091,
    name: "Apex_Drifter",
    level: 48,
    age: 412,
    attacksWon: 1240,
    lastAction: "2m ago",
    activityStatus: "ONLINE",
    statTier: "50M - 150M (Strong Mid)",
    job: "Sweet Shop (Director)",
    isFactionless: true,
  },
  {
    id: 3501294,
    name: "Nightshade_X",
    level: 32,
    age: 280,
    attacksWon: 890,
    lastAction: "18m ago",
    activityStatus: "ACTIVE (15M AGO)",
    statTier: "10M - 50M (Active Fighter)",
    job: "Oil Rig (Roughneck)",
    isFactionless: true,
  },
  {
    id: 3619022,
    name: "Valkyrie_Rose",
    level: 55,
    age: 580,
    attacksWon: 2410,
    lastAction: "45m ago",
    activityStatus: "ACTIVE (1H AGO)",
    statTier: "150M - 500M (War Ready)",
    job: "Pub (Bouncer)",
    isFactionless: true,
  },
  {
    id: 3782910,
    name: "GhostProtocol",
    level: 28,
    age: 195,
    attacksWon: 620,
    lastAction: "5m ago",
    activityStatus: "ONLINE",
    statTier: "5M - 20M (Fast Grower)",
    job: "Candle Shop (Apprentice)",
    isFactionless: true,
  },
  {
    id: 3390141,
    name: "RogueShadow",
    level: 42,
    age: 360,
    attacksWon: 1100,
    lastAction: "1h 10m ago",
    activityStatus: "ACTIVE (1H AGO)",
    statTier: "25M - 75M (Consistent)",
    job: "Grocery Store",
    isFactionless: true,
  },
];

export default function RecruitmentPage() {
  const { userProfile } = useTorn();
  const [minLevel, setMinLevel] = useState<number>(20);
  const [minAttacks, setMinAttacks] = useState<number>(500);
  const [factionlessOnly, setFactionlessOnly] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeMessageModal, setActiveMessageModal] = useState<Candidate | null>(null);
  const [copiedPitch, setCopiedPitch] = useState<boolean>(false);

  const factionName = userProfile?.factionName || "our faction";
  const factionProfileLink = userProfile?.factionId
    ? `https://www.torn.com/factions.php?step=profile&ID=${userProfile.factionId}`
    : "https://www.torn.com/factions.php?step=profile";

  const generatePitch = (candidate: Candidate) => {
    return `Hey ${candidate.name},

I saw you're active and currently unaligned. Our faction, ${factionName}, is recruiting consistent players for upcoming Ranked Wars and high-respect chains.

Here is what we offer every member:
• Max Steadfast perks + Full Faction Armory (Combat armor, weapons, Xanax, medical supplies)
• 100% Automated War Payouts with Fair-Fight multipliers paid immediately after wars
• Coordinated OC 2.0 teams with high success rates
• Active, chill community with zero toxic drama

Check out our faction profile here: ${factionProfileLink}
Drop an application or message me if you'd like an invite!`;
  };

  const handleCopyPitch = (candidate: Candidate) => {
    navigator.clipboard.writeText(generatePitch(candidate));
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              TALENT SCOUTING • RADAR
            </span>
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> UNLIMITED SCANS • 100% FREE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <span>Faction Recruitment Radar</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Stop bumping forum recruitment threads. Find active, unaligned combatants and recruits straight from the live leaderboard.
          </p>
        </div>

        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm shrink-0">
          <Search className="w-4 h-4" />
          <span>Run Candidate Scan</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center text-xs">
        <div>
          <label htmlFor="minLevel" className="text-[11px] font-mono text-zinc-400 block mb-1.5">
            Minimum Level: <span className="text-white font-bold">{minLevel}</span>
          </label>
          <input
            id="minLevel"
            name="minLevel"
            aria-label="Minimum Level"
            type="range"
            min={10}
            max={80}
            value={minLevel}
            onChange={(e) => setMinLevel(Number(e.target.value))}
            className="w-full accent-blue-500 bg-[#18181c]"
          />
        </div>

        <div>
          <label htmlFor="minAttacks" className="text-[11px] font-mono text-zinc-400 block mb-1.5">
            Min Attacks Won: <span className="text-white font-bold">{minAttacks}</span>
          </label>
          <input
            id="minAttacks"
            name="minAttacks"
            aria-label="Minimum Attacks Won"
            type="range"
            min={100}
            max={3000}
            step={100}
            value={minAttacks}
            onChange={(e) => setMinAttacks(Number(e.target.value))}
            className="w-full accent-blue-500 bg-[#18181c]"
          />
        </div>

        <div>
          <label htmlFor="searchCandidate" className="text-[11px] font-mono text-zinc-400 block mb-1.5">Search Candidate</label>
          <input
            id="searchCandidate"
            name="searchCandidate"
            aria-label="Search Candidate"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full bg-black border border-[#27272a] px-3 py-1.5 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-4 sm:pt-0">
          <label htmlFor="factionlessOnly" className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="factionlessOnly"
              name="factionlessOnly"
              type="checkbox"
              checked={factionlessOnly}
              onChange={(e) => setFactionlessOnly(e.target.checked)}
              className="accent-blue-500 rounded"
            />
            <span className="text-zinc-300 font-semibold text-xs">Factionless Only</span>
          </label>
        </div>
      </div>

      {/* Candidate List Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono">
          <span>Found {mockCandidates.length} Active Candidates</span>
          <span>Sorted by Recent Activity & Combat Score</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {mockCandidates.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225] hover:border-[#303038] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-white">{c.name}</span>
                  <span className="text-xs font-mono text-zinc-500">[{c.id}]</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {c.activityStatus}
                  </span>
                  {c.isFactionless && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                      FACTIONLESS
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-mono">
                  <span>Level: <strong className="text-white">{c.level}</strong></span>
                  <span>Age: <strong className="text-zinc-200">{c.age}d</strong></span>
                  <span>Attacks Won: <strong className="text-amber-400">{c.attacksWon.toLocaleString()}</strong></span>
                  <span>Est. Stats: <strong className="text-purple-300">{c.statTier}</strong></span>
                  <span>Employment: <strong className="text-zinc-300">{c.job}</strong></span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveMessageModal(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Compose Pitch</span>
                </button>

                <a
                  href={`https://www.torn.com/messages.php#/p=compose&XID=${c.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-[#27272a] text-zinc-200 text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Message on Torn</span>
                </a>

                <a
                  href={`https://www.torn.com/profiles.php?XID=${c.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-[#141416] border border-[#27272a] text-zinc-400 hover:text-white transition-colors"
                  title="View Torn Profile"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 1-Click Message Modal */}
      {activeMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f13] border border-[#2a2a32] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222226] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>Personalized Recruitment Pitch for {activeMessageModal.name}</span>
              </div>
              <button
                onClick={() => setActiveMessageModal(null)}
                className="text-zinc-500 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <textarea
              readOnly
              rows={11}
              value={generatePitch(activeMessageModal)}
              className="w-full bg-black border border-[#26262a] rounded-lg p-3 text-xs text-zinc-200 font-mono leading-relaxed resize-none focus:outline-none"
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-zinc-400">
                Includes your faction link & perks automatically.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyPitch(activeMessageModal)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedPitch ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPitch ? "Copied!" : "Copy Pitch"}</span>
                </button>
                <a
                  href={`https://www.torn.com/messages.php#/p=compose&XID=${activeMessageModal.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#1c1c22] hover:bg-[#282830] text-zinc-200 border border-[#2e2e36] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
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

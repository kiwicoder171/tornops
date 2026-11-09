"use client";

import { useState, useEffect } from "react";
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
  AlertCircle,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";

export interface Candidate {
  id: number;
  name: string;
  level: number;
  age: number; // days
  attacksWon: number;
  lastAction: string;
  activityStatus: "ONLINE" | "ACTIVE (15M AGO)" | "ACTIVE (1H AGO)" | "OFFLINE";
  statTier: string;
  job: string;
  isFactionless: boolean;
  factionName?: string;
}

const DEMO_CANDIDATES: Candidate[] = [
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
];

export default function RecruitmentPage() {
  const { userProfile, isLive, apiKey, isHydrated } = useTorn();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [scoutId, setScoutId] = useState("");
  const [isScouting, setIsScouting] = useState(false);
  const [scoutError, setScoutError] = useState<string | null>(null);
  const [activeMessageModal, setActiveMessageModal] = useState<Candidate | null>(null);
  const [copiedPitch, setCopiedPitch] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isLive || !apiKey) {
      setCandidates(DEMO_CANDIDATES);
    }
  }, [isHydrated, isLive, apiKey]);

  const factionName = userProfile?.factionName || "our faction";
  const factionProfileLink = userProfile?.factionId
    ? `https://www.torn.com/factions.php?step=profile&ID=${userProfile.factionId}`
    : "https://www.torn.com/factions.php?step=profile";

  // Scout a real player via live Torn API
  const handleScoutPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoutId.trim()) return;

    setIsScouting(true);
    setScoutError(null);

    try {
      const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : "";
      const res = await fetch(`/api/torn/user?selections=profile,personalstats&id=${encodeURIComponent(scoutId.trim())}${keyParam}`);
      const data = await res.json();

      if (data.error) {
        setScoutError(`Torn API: ${data.error.error || "Player not found or invalid ID"}`);
        setIsScouting(false);
        return;
      }

      const p = data.profile || data;
      const pid = p.player_id || p.id || Number(scoutId);
      const attacks = data.personalstats?.attackswon || data.personalstats?.attacks_won || 0;
      const hasFaction = !!(data.faction?.faction_id || p.faction?.faction_id || (p.faction && p.faction.faction_id > 0));
      const facName = data.faction?.faction_name || p.faction?.faction_name;

      const newCand: Candidate = {
        id: pid,
        name: p.name || `Player [${pid}]`,
        level: p.level || 1,
        age: p.age || 0,
        attacksWon: attacks,
        lastAction: p.last_action?.relative || "Recently",
        activityStatus: p.last_action?.status === "Online" ? "ONLINE" : "ACTIVE (15M AGO)",
        statTier: attacks > 1000 ? "War Ready Veteran" : attacks > 200 ? "Growing Combatant" : "New Recruit",
        job: p.job?.company_name || p.job?.position || "Citizen",
        isFactionless: !hasFaction,
        factionName: hasFaction ? facName : undefined,
      };

      setCandidates((prev) => [newCand, ...prev.filter((c) => c.id !== pid)]);
      setScoutId("");
    } catch (err: any) {
      setScoutError("Failed to reach Torn API. Please verify the Player ID.");
    } finally {
      setIsScouting(false);
    }
  };

  const generatePitch = (candidate: Candidate) => {
    return `Hey ${candidate.name},

I saw you're active${candidate.isFactionless ? " and currently unaligned" : ""}. Our faction, ${factionName}, is recruiting consistent players for upcoming Ranked Wars and high-respect chains.

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#0c0c0e] border border-[#1e1e24] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              TALENT SCOUTING • RADAR
            </span>
            {isLive ? (
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE TORN API SCOUT
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400 font-mono">DEMO PREVIEW</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <span>Faction Recruitment Radar & Pitch Generator</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Scout real Torn combatants, inspect faction alignment, and generate tailored 1-click recruitment messages.
          </p>
        </div>
      </div>

      {/* Live Scout Input Bar */}
      <div className="p-4 rounded-xl bg-[#0c0c0f] border border-[#1b1b22]">
        <form onSubmit={handleScoutPlayer} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Torn Player ID to scout (e.g. 3412091, 2841092)..."
              value={scoutId}
              onChange={(e) => setScoutId(e.target.value)}
              className="w-full bg-[#121217] border border-[#20202a] focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isScouting}
            className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {isScouting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scouting Player...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Scout Player Live</span>
              </>
            )}
          </button>
        </form>

        {scoutError && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-950/30 border border-red-900/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{scoutError}</span>
          </div>
        )}
      </div>

      {/* Scouted Candidates List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono">
          <span>{candidates.length} Scouted Prospect(s)</span>
          <span>Target Alignment & Pitch Station</span>
        </div>

        {candidates.length === 0 ? (
          <div className="p-12 rounded-xl bg-[#0c0c0f] border border-dashed border-[#1f1f28] text-center space-y-2">
            <UserCheck className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Players Scouted Yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Enter any Torn Player ID above to pull their real combat record, check if they are factionless, and generate a customized pitch message!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-[#0c0c0f] border border-[#1c1c24] hover:border-[#2b2b36] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-white">{c.name}</span>
                    <span className="text-xs font-mono text-zinc-500">[{c.id}]</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {c.activityStatus}
                    </span>
                    {c.isFactionless ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                        FACTIONLESS (UNALIGNED)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">
                        In {c.factionName || "Faction"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-mono">
                    <span>Level: <strong className="text-white">{c.level}</strong></span>
                    <span>Age: <strong className="text-zinc-200">{c.age}d</strong></span>
                    <span>Attacks Won: <strong className="text-amber-400">{c.attacksWon.toLocaleString()}</strong></span>
                    <span>Tier: <strong className="text-purple-300">{c.statTier}</strong></span>
                    <span>Employment: <strong className="text-zinc-300">{c.job}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://www.torn.com/profiles.php?XID=${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-zinc-400 hover:text-white bg-[#141418] border border-[#23232b] rounded-lg transition-colors"
                    title="View Torn Profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setActiveMessageModal(c)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Pitch Recruit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recruitment Pitch Modal */}
      {activeMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-5 rounded-xl bg-[#0e0e12] border border-[#282835] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#20202a]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Recruitment Pitch for {activeMessageModal.name} [{activeMessageModal.id}]
                </h3>
              </div>
              <button
                onClick={() => setActiveMessageModal(null)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 font-medium">
                Copy and paste this message into Torn Mail or chat:
              </label>
              <textarea
                readOnly
                rows={9}
                value={generatePitch(activeMessageModal)}
                className="w-full bg-[#14141a] border border-[#252532] rounded-lg p-3 text-xs text-zinc-200 font-mono focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={`https://www.torn.com/messages.php#/p=compose&XID=${activeMessageModal.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Torn Mail Composer</span>
              </a>

              <button
                onClick={() => handleCopyPitch(activeMessageModal)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedPitch ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Pitch Message</span>
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

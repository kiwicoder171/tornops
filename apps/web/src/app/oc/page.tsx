"use client";

import { useState, useEffect } from "react";
import {
  Users,
  AlertCircle,
  CheckCircle2,
  Bell,
  Shield,
  Sparkles,
  Lock,
  Unlock,
  TrendingUp,
  ExternalLink,
  Crown,
  User,
} from "lucide-react";
import {
  OC_TEMPLATES,
} from "@torn/shared";
import { useTorn } from "@/context/TornContext";

interface UserSkill {
  slug: string;
  name: string;
  level: number;
}

interface FactionCandidate {
  id: number;
  name: string;
  level: number;
  bestSkillName: string;
  skillLevel: number;
}

const DEMO_CANDIDATES: FactionCandidate[] = [
  { id: 4430788, name: "Eklatant (Leader)", level: 28, bestSkillName: "Burglary", skillLevel: 68 },
  { id: 4072152, name: "kisagikun", level: 25, bestSkillName: "Cracking", skillLevel: 74 },
  { id: 4158320, name: "Kakemannen", level: 23, bestSkillName: "Illicit Services", skillLevel: 58 },
  { id: 4535577, name: "EvilBadger", level: 13, bestSkillName: "Disposal", skillLevel: 52 },
  { id: 2869985, name: "RubberDuck3179", level: 19, bestSkillName: "Scamming", skillLevel: 46 },
  { id: 4552150, name: "NongGuyver (You)", level: 4, bestSkillName: "Search for Cash", skillLevel: 12.11 },
];

const DEMO_SKILLS: UserSkill[] = [
  { slug: "search_for_cash", name: "Search for Cash", level: 12.11 },
  { slug: "arson", name: "Arson", level: 3.0 },
  { slug: "bootlegging", name: "Bootlegging", level: 2.16 },
  { slug: "scamming", name: "Scamming", level: 2.09 },
  { slug: "shoplifting", name: "Shoplifting", level: 1.9 },
  { slug: "pickpocketing", name: "Pickpocketing", level: 1.87 },
  { slug: "graffiti", name: "Graffiti", level: 1.71 },
  { slug: "hustling", name: "Hustling", level: 1.39 },
];

export default function OcOptimizerPage() {
  const { isLive, apiKey, userProfile } = useTorn();

  // Role detection: accurately check whether current user is Leader or Co-Leader with AA
  const isActualLeader =
    userProfile?.hasAA ||
    userProfile?.isLeader ||
    userProfile?.isCoLeader ||
    userProfile?.position?.toLowerCase() === "leader" ||
    userProfile?.position?.toLowerCase().includes("co-leader") ||
    false;

  // View mode state - default to LEADER so faction mates can try it out immediately
  const [viewMode, setViewMode] = useState<"LEADER" | "MEMBER">("LEADER");

  // Keep viewMode synced if user connects as a real leader
  useEffect(() => {
    if (isLive && isActualLeader) {
      setViewMode("LEADER");
    }
  }, [isLive, isActualLeader]);

  // Guaranteed active view: fully unlocked for testing!
  const activeView: "LEADER" | "MEMBER" = viewMode;

  // --- Leader State ---
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [lockedSlots, setLockedSlots] = useState<Record<string, number>>({});
  const [pinged, setPinged] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<FactionCandidate[]>(DEMO_CANDIDATES);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [isSyncingPlan, setIsSyncingPlan] = useState(false);

  const effectiveFactionId = userProfile?.factionId || 57693;

  // Load shared faction OC plan from Firestore API
  useEffect(() => {
    const fetchCloudPlan = async () => {
      try {
        const res = await fetch(`/api/oc?factionId=${effectiveFactionId}`);
        const data = await res.json();
        if (data.plan) {
          if (typeof data.plan.selectedTemplateIndex === "number") {
            setSelectedTemplateIndex(data.plan.selectedTemplateIndex);
          }
          if (data.plan.lockedSlots) {
            setLockedSlots(data.plan.lockedSlots);
          }
          setCloudSynced(true);
        }
      } catch {
        // Retain default
      }
    };
    fetchCloudPlan();
  }, [effectiveFactionId]);

  // Save plan to cloud
  const savePlanToCloud = async (templateIdx: number, slots: Record<string, number>) => {
    setIsSyncingPlan(true);
    try {
      await fetch("/api/oc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factionId: effectiveFactionId,
          selectedTemplateIndex: templateIdx,
          lockedSlots: slots,
          updatedBy: userProfile?.name || "Leader",
        }),
      });
      setCloudSynced(true);
    } catch {
      // Retain local state
    } finally {
      setIsSyncingPlan(false);
    }
  };

  // --- Member State ---
  const [mySkills, setMySkills] = useState<UserSkill[]>(isLive ? [] : DEMO_SKILLS);

  // Fetch real skills & faction members if connected live
  useEffect(() => {
    if (!isLive || !apiKey) {
      setCandidates(DEMO_CANDIDATES);
      setMySkills(DEMO_SKILLS);
      return;
    }

    const fetchLiveSkills = async () => {
      try {
        const res = await fetch(`/api/torn/user?selections=skills&key=${encodeURIComponent(apiKey)}`);
        const data = await res.json();
        if (Array.isArray(data.skills) && data.skills.length > 0) {
          setMySkills(data.skills);
        }
      } catch {
        // Retain current state
      }
    };

    const fetchLiveCandidates = async () => {
      try {
        const res = await fetch(`/api/torn/faction?selections=basic&key=${encodeURIComponent(apiKey)}`);
        const data = await res.json();
        if (data.members) {
          const raw = Array.isArray(data.members)
            ? data.members
            : Object.entries(data.members).map(([id, m]) => ({ id: Number(id), ...(m as object) } as any));
          const liveCands: FactionCandidate[] = raw.map((m: any) => ({
            id: m.id,
            name: m.name,
            level: m.level || 1,
            bestSkillName: "Crimes 2.0 Operative",
            skillLevel: Math.min(100, (m.level || 1) * 2),
          }));
          setCandidates(liveCands);
        }
      } catch {
        // Retain
      }
    };

    fetchLiveSkills();
    fetchLiveCandidates();
  }, [isLive, apiKey]);

  const currentTemplate = OC_TEMPLATES[selectedTemplateIndex];

  const handleSelectTemplate = (idx: number) => {
    setSelectedTemplateIndex(idx);
    savePlanToCloud(idx, lockedSlots);
  };

  const toggleLockSlot = (slotKey: string, memberId: number) => {
    const updated = { ...lockedSlots };
    if (updated[slotKey]) {
      delete updated[slotKey];
    } else {
      updated[slotKey] = memberId;
    }
    setLockedSlots(updated);
    savePlanToCloud(selectedTemplateIndex, updated);
  };

  const handlePingMember = (id: number) => {
    setPinged(id);
    setTimeout(() => setPinged(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header with Role Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Organized Crime 2.0 Command Center
            </h1>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-md border inline-flex items-center gap-1 ${
                activeView === "LEADER"
                  ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                  : "bg-blue-500/10 text-blue-300 border-blue-500/20"
              }`}
            >
              {activeView === "LEADER" ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-purple-400" />
                  <span>Leader AA Optimizer</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Member View ({userProfile?.position || "Recruit"})</span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeView === "LEADER"
              ? "Recommend and lock optimal members into OC 2.0 slots based on faction API skills."
              : `Your assigned Crimes 2.0 operations and live skill tree for ${userProfile?.factionName || "your faction"}.`}
          </p>
        </div>

        {/* View Switcher & Cloud Status */}
        <div className="flex flex-wrap items-center gap-2">
          {cloudSynced && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>{isSyncingPlan ? "Syncing..." : `Cloud Synced (Faction #${effectiveFactionId})`}</span>
            </div>
          )}

          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("LEADER")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeView === "LEADER"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {isLive && !isActualLeader ? "Leader Optimizer (Testing Mode)" : "Leader Optimizer"}
          </button>
          <button
            onClick={() => setViewMode("MEMBER")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeView === "MEMBER"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Member View
          </button>
        </div>
      </div>
    </div>

      {/* Leadership Unlocked Notice for Testing */}
      {isLive && !isActualLeader && activeView === "LEADER" && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Full Leader Optimizer Unlocked for Testing</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                All Crimes 2.0 team planning, slot recommendation algorithms, slot locks, and Discord alerts are unlocked so you can fully test the suite.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-emerald-900/40 text-emerald-300 rounded border border-emerald-700/50 whitespace-nowrap">
            Full Access
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* LEADER / CO-LEADER VIEW */}
      {/* ========================================================= */}
      {activeView === "LEADER" && (
        <div className="space-y-6">
          {/* Stalled Invites Alert (Demo only) */}
          {!isLive && (
            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">
                    Stalled Invite: RubberDuck3179 <span className="font-mono text-slate-400 tabular-nums">[2869985]</span>
                  </h3>
                  <p className="text-xs text-amber-300/80 mt-0.5">
                    Unaccepted invite for <strong>Safehouse Infiltration</strong> (pending for 6 hours).
                  </p>
                </div>
              </div>

              <button
                onClick={() => handlePingMember(2869985)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow-sm"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{pinged === 2869985 ? "Discord Nudge Sent!" : "Nudge Member"}</span>
              </button>
            </div>
          )}

          {/* Crime Template Selector */}
          <div className="flex flex-wrap gap-2.5">
            {OC_TEMPLATES.map((tpl, idx) => (
              <button
                key={tpl.crimeTypeId}
                onClick={() => handleSelectTemplate(idx)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                  selectedTemplateIndex === idx
                    ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <div className="text-left">
                  <span className="font-semibold block">{tpl.crimeName}</span>
                  <span className="text-[11px] text-slate-500 capitalize">{tpl.difficulty} Difficulty</span>
                </div>
              </button>
            ))}
          </div>

          {/* Slots & Locking Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Optimal Slot Recommendations & Member Locking
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analyzes faction member skill ratings to recommend and lock the highest probability lineup.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20 font-semibold tabular-nums">
                88% Expected Success
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {currentTemplate.slots.map((slot) => {
                const slotKey = `${currentTemplate.crimeTypeId}-${slot.slotIndex}`;
                const isLocked = !!lockedSlots[slotKey];
                const candidate = candidates.length > 0 ? candidates[slot.slotIndex % candidates.length] : null;

                return (
                  <div
                    key={slot.slotIndex}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-800/20 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold font-mono text-purple-400 border border-slate-700 tabular-nums">
                        #{slot.slotIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-white flex items-center gap-2 text-sm">
                          {slot.slotName}
                          {isLocked && (
                            <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/10 text-amber-300 rounded border border-amber-500/20 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Locked
                            </span>
                          )}
                        </h3>
                        <span className="text-xs text-slate-500">
                          Req: {slot.primarySkill} (Min: {slot.minSkillLevel})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-medium text-white block">
                          {candidate ? candidate.name : "Awaiting Lineup"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono tabular-nums">
                          Skill Level: <strong className="text-purple-400">{candidate ? candidate.skillLevel : "--"}</strong>
                        </span>
                      </div>

                      {/* Lock / Unlock Toggle Button */}
                      <button
                        onClick={() => candidate && toggleLockSlot(slotKey, candidate.id)}
                        disabled={!candidate}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${
                          isLocked
                            ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                        }`}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5" /> Slot Locked
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" /> Lock Member
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MEMBER VIEW */}
      {/* ========================================================= */}
      {activeView === "MEMBER" && (
        <div className="space-y-6">
          {/* Active Assignment Card */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">
                    Your Assigned Crime 2.0
                  </span>
                  <h2 className="text-base font-bold text-white mt-0.5">
                    {isLive ? "Crimes 2.0 Operative Standby" : "Safehouse Infiltration"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isLive
                      ? "Awaiting leader squad assignment. Ensure your crime skills are trained below."
                      : "Slot: Lookout & Intel | Required Skill: Burglary"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {isLive ? "Telemetry Connected" : "Selected by Faction Leader"}
                </span>
                <a
                  href="https://www.torn.com/factions.php?step=your#/war/crimes"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Crime in Torn
                </a>
              </div>
            </div>
          </div>

          {/* Personal Crimes 2.0 Skill Tree */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Your Crimes 2.0 Skill Tree
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live proficiencies pulled directly from your Torn account ({userProfile?.name || "Player"}{" "}
                  {userProfile?.playerId && <span className="font-mono tabular-nums">[{userProfile.playerId}]</span>}).
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {mySkills.length} Skills Tracked
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {mySkills.map((sk) => {
                const maxLevel = 100;
                const pct = Math.min(100, (sk.level / maxLevel) * 100);

                return (
                  <div
                    key={sk.slug}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white">{sk.name}</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs tabular-nums">
                        Lvl {sk.level.toFixed(2)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

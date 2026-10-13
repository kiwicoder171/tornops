"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Globe,
  Clock,
  Sun,
  Moon,
  Shield,
  Swords,
  Flame,
  AlertTriangle,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Edit3,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Sliders,
  Calendar,
  X,
  Zap,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";
import {
  FactionMemberAvailability,
  HourlyCoverageData,
  ShiftAlert,
  compute24hCoverage,
  analyzeCoverageShifts,
  isMemberAwakeAtTct,
  isMemberOnChainWatchAtTct,
  tctHourToLocalHour,
  localHourToTctHour,
  GLOBAL_TIMEZONES_PRESET,
  DEMO_FACTION_TIMEZONES,
} from "@torn/shared";

const STORAGE_KEY = "torn_faction_timezones_v1";

function getMemberLocalTime(tz: string, fallbackOffset: number, date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    const localHour = tctHourToLocalHour(date.getUTCHours(), fallbackOffset);
    const ampm = localHour >= 12 ? "PM" : "AM";
    const h12 = localHour % 12 === 0 ? 12 : localHour % 12;
    return `${h12}:${date.getUTCMinutes().toString().padStart(2, "0")} ${ampm}`;
  }
}

export default function FactionCoveragePage() {
  const { isLive, apiKey, userProfile } = useTorn();

  // Current real-time TCT Clock (UTC)
  const [now, setNow] = useState<Date>(new Date());
  const [isNewMember, setIsNewMember] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTctHour = now.getUTCHours();
  const currentTctMinute = now.getUTCMinutes();
  const currentTctSecond = now.getUTCSeconds();
  const tctTimeFormatted = `${currentTctHour.toString().padStart(2, "0")}:${currentTctMinute
    .toString()
    .padStart(2, "0")}:${currentTctSecond.toString().padStart(2, "0")} TCT`;

  // Availability roster state
  const [members, setMembers] = useState<FactionMemberAvailability[]>(isLive ? [] : DEMO_FACTION_TIMEZONES);
  const [isLiveRosterLoaded, setIsLiveRosterLoaded] = useState(false);
  const [isLoadingRoster, setIsLoadingRoster] = useState(isLive);

  // Load persisted member timezones from localStorage in Demo Mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLive) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMembers(parsed);
          }
        }
      } catch {
        // Fallback to default
      }
    }
  }, [isLive]);

  // Sync with Live Torn API faction roster if key is available
  useEffect(() => {
    if (!isLive || !apiKey) {
      if (!isLive) {
        setMembers(DEMO_FACTION_TIMEZONES);
      }
      return;
    }

    let isMounted = true;
    const fetchLiveRoster = async () => {
      setIsLoadingRoster(true);
      try {
        const res = await fetch(`/api/torn/faction?selections=basic&key=${encodeURIComponent(apiKey)}`);
        const data = await res.json();
        if (!isMounted) return;
        setIsLoadingRoster(false);

        if (!data.members || typeof data.members !== "object") {
          setMembers([]);
          setIsLiveRosterLoaded(true);
          return;
        }

        const liveMembersMap = data.members;
        const liveList: FactionMemberAvailability[] = Object.entries(liveMembersMap).map(([idStr, m]: [string, any]) => {
          const id = Number(idStr);
          // Check if we already have saved timezone info for this member
          const existing = members.find((x) => x.memberId === id);

          const lastActionStatus: "Online" | "Idle" | "Offline" =
            m.last_action?.status === "Online"
              ? "Online"
              : m.last_action?.status === "Idle"
              ? "Idle"
              : "Offline";

          const inGameStatus: "Okay" | "Hospital" | "Traveling" | "Jail" | "Abroad" =
            m.status?.state === "Hospital"
              ? "Hospital"
              : m.status?.state === "Traveling"
              ? "Traveling"
              : m.status?.state === "Jail"
              ? "Jail"
              : "Okay";

          if (existing) {
            return {
              ...existing,
              name: m.name || existing.name,
              level: m.level || existing.level,
              position: m.position || existing.position,
              lastActionStatus,
              inGameStatus,
            };
          }

          // If new member, assign intelligent default
          return {
            memberId: id,
            name: m.name,
            level: m.level || 1,
            position: m.position || "Member",
            timezone: "Atlantic/Reykjavik",
            timezoneLabel: "GMT / TCT (UTC+0)",
            utcOffset: 0,
            awakeStartLocal: 8,
            awakeEndLocal: 23,
            chainWatchStartTct: 12,
            chainWatchEndTct: 18,
            warPreference: "ALL" as const,
            ocReady: true,
            lastActionStatus,
            inGameStatus,
            notes: "Live faction member",
          };
        });

        if (liveList.length > 0) {
          setMembers(liveList);
          setIsLiveRosterLoaded(true);
        } else {
          setMembers([]);
        }
      } catch {
        setIsLoadingRoster(false);
      }
    };

    fetchLiveRoster();
  }, [isLive, apiKey]);

  // Persist whenever members state is updated
  const saveRoster = (newMembers: FactionMemberAvailability[]) => {
    setMembers(newMembers);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMembers));
    } catch {
      // Storage error fallback
    }
  };

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AWAKE" | "ASLEEP" | "CHAIN_WATCH" | "OC_READY">("ALL");
  const [warFilter, setWarFilter] = useState<"ALL" | "WEEKEND" | "WEEKDAY">("ALL");
  const [selectedHourHighlight, setSelectedHourHighlight] = useState<number | null>(null);

  // Edit / Self-Service Modal state
  const [editingMember, setEditingMember] = useState<FactionMemberAvailability | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Leadership privileges check
  const isLeader =
    userProfile?.isLeader ||
    userProfile?.isCoLeader ||
    userProfile?.hasAA ||
    userProfile?.position?.toLowerCase().includes("leader") ||
    !isLive; // In demo mode, leader controls are fully accessible

  // Compute 24-hour TCT shift distribution
  const coverageData: HourlyCoverageData[] = useMemo(() => {
    return compute24hCoverage(members);
  }, [members]);

  // Analyze shift alerts
  const shiftAlerts: ShiftAlert[] = useMemo(() => {
    return analyzeCoverageShifts(coverageData);
  }, [coverageData]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesId = m.memberId.toString().includes(q);
        const matchesTz = m.timezoneLabel.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesTz) return false;
      }

      // Hour highlight filter (if user clicked an hour on the timeline)
      const targetHour = selectedHourHighlight !== null ? selectedHourHighlight : currentTctHour;

      // Status filter
      if (statusFilter === "AWAKE") {
        if (!isMemberAwakeAtTct(m, targetHour)) return false;
      } else if (statusFilter === "ASLEEP") {
        if (isMemberAwakeAtTct(m, targetHour)) return false;
      } else if (statusFilter === "CHAIN_WATCH") {
        if (!isMemberOnChainWatchAtTct(m, targetHour)) return false;
      } else if (statusFilter === "OC_READY") {
        if (!m.ocReady) return false;
      }

      // War preference filter
      if (warFilter === "WEEKEND" && m.warPreference === "WEEKDAY") return false;
      if (warFilter === "WEEKDAY" && m.warPreference === "WEEKEND") return false;

      return true;
    });
  }, [members, searchQuery, statusFilter, warFilter, selectedHourHighlight, currentTctHour]);

  // Summary counts
  const totalCount = members.length;
  const awakeNowCount = members.filter((m) => isMemberAwakeAtTct(m, currentTctHour)).length;
  const chainWatchNowCount = members.filter((m) => isMemberOnChainWatchAtTct(m, currentTctHour)).length;
  const ocReadyCount = members.filter((m) => m.ocReady).length;
  const weekendFightersCount = members.filter((m) => m.warPreference === "WEEKEND" || m.warPreference === "ALL").length;

  // Open modal for current logged-in user
  const handleOpenSelfEdit = () => {
    setIsNewMember(false);
    const myId = userProfile?.playerId || 4552150;
    const existing = members.find((m) => m.memberId === myId);

    if (existing) {
      setEditingMember({ ...existing });
    } else {
      // Auto-detect browser timezone
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
      const preset = GLOBAL_TIMEZONES_PRESET.find((p) => p.value === browserTz) || GLOBAL_TIMEZONES_PRESET[3];
      const newSelf: FactionMemberAvailability = {
        memberId: myId,
        name: userProfile?.name || "NongGuyver",
        level: userProfile?.level || 6,
        position: userProfile?.position || "Member",
        timezone: preset.value,
        timezoneLabel: preset.label,
        utcOffset: preset.offset,
        awakeStartLocal: 8,
        awakeEndLocal: 23,
        chainWatchStartTct: 12,
        chainWatchEndTct: 18,
        warPreference: "ALL",
        ocReady: true,
        ocPreferredTct: "12:00 - 18:00 TCT",
        lastActionStatus: "Online",
        inGameStatus: "Okay",
      };
      setEditingMember(newSelf);
    }
    setIsModalOpen(true);
  };

  // Open modal for specific member (Leader edit or self)
  const handleOpenMemberEdit = (member: FactionMemberAvailability) => {
    setIsNewMember(false);
    setEditingMember({ ...member });
    setIsModalOpen(true);
  };

  // Open modal to add a brand new member (Leader action)
  const handleOpenAddNewMember = () => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
    const preset = GLOBAL_TIMEZONES_PRESET.find((p) => p.value === browserTz) || GLOBAL_TIMEZONES_PRESET[3];
    const newMember: FactionMemberAvailability = {
      memberId: Math.floor(4000000 + Math.random() * 900000),
      name: "",
      level: 50,
      position: "Member",
      timezone: preset.value,
      timezoneLabel: preset.label,
      utcOffset: preset.offset,
      awakeStartLocal: 8,
      awakeEndLocal: 23,
      chainWatchStartTct: 12,
      chainWatchEndTct: 18,
      warPreference: "ALL",
      ocReady: true,
      ocPreferredTct: "12:00 - 18:00 TCT",
      lastActionStatus: "Online",
      inGameStatus: "Okay",
      notes: "Faction member",
    };
    setEditingMember(newMember);
    setIsNewMember(true);
    setIsModalOpen(true);
  };

  // Save member form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.name.trim()) return;

    const exists = members.some((m) => m.memberId === editingMember.memberId);
    let updated: FactionMemberAvailability[];
    if (exists) {
      updated = members.map((m) => (m.memberId === editingMember.memberId ? editingMember : m));
    } else {
      updated = [editingMember, ...members];
    }

    saveRoster(updated);
    setIsModalOpen(false);
    setEditingMember(null);
    setIsNewMember(false);
  };

  // Auto-detect timezone helper inside modal
  const handleAutoDetectTimezone = () => {
    if (!editingMember) return;
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const nowDt = new Date();
      // Calculate offset in hours from UTC
      const offsetMinutes = -nowDt.getTimezoneOffset();
      const offsetHours = offsetMinutes / 60;

      const matchedPreset = GLOBAL_TIMEZONES_PRESET.find((p) => p.value === browserTz);
      const label = matchedPreset ? matchedPreset.label : `${browserTz} (UTC${offsetHours >= 0 ? `+${offsetHours}` : offsetHours})`;

      setEditingMember({
        ...editingMember,
        timezone: browserTz,
        timezoneLabel: label,
        utcOffset: offsetHours,
      });
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Live TCT Synchronized Clock */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Faction Timezone & War Shift Hub
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">
                  GLOBAL 24H TCT
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Harmonize global player hours onto the 24-Hour Torn City Time clock. Prevent chain drops and coordinate devastating war pushes.
              </p>
            </div>
          </div>
        </div>

        {/* Global Synchronized TCT Clock & Self-Service CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-zinc-950/90 border border-zinc-800 rounded-lg">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Torn City Time</span>
              <span
                suppressHydrationWarning
                className="text-sm font-bold font-mono text-emerald-400 tabular-nums"
              >
                {tctTimeFormatted}
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenSelfEdit}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Set My Timezone & Availability</span>
          </button>
        </div>
      </div>

      {/* Summary Vitals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Awake Right Now */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" /> Awake Right Now
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {Math.round((awakeNowCount / Math.max(totalCount, 1)) * 100)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{awakeNowCount}</span>
            <span className="text-xs text-zinc-500 font-mono">/ {totalCount} members</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(awakeNowCount / Math.max(totalCount, 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Chain Watch Guard Duty */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" /> On Chain Watch
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Active Shift
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{chainWatchNowCount}</span>
            <span className="text-xs text-zinc-500 font-mono">guards assigned</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            {chainWatchNowCount >= 3 ? "🛡️ Chain is well guarded" : "⚠️ Low watcher coverage"}
          </p>
        </div>

        {/* OC 2.0 Ready */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" /> OC 2.0 Ready
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Crimes
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{ocReadyCount}</span>
            <span className="text-xs text-zinc-500 font-mono">/ {totalCount} ready</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">Prepared for synchronized execution</p>
        </div>

        {/* Weekend War Roster */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-amber-400" /> Weekend Warriors
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              RW Wars
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{weekendFightersCount}</span>
            <span className="text-xs text-zinc-500 font-mono">fighters available</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">Optimal for Fri-Sun matchmaking</p>
        </div>
      </div>

      {/* Shift Alerts & Tactical Recommendations */}
      {shiftAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shiftAlerts.map((alert, idx) => {
            const isCrit = alert.severity === "HIGH";
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  isCrit
                    ? "bg-red-950/20 border-red-900/50 text-red-200"
                    : "bg-emerald-950/20 border-emerald-900/50 text-emerald-200"
                }`}
              >
                {isCrit ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <Swords className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-tight text-white">{alert.title}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-black/40 border border-current">
                      {alert.tctWindow}
                    </span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">{alert.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 24-Hour Global TCT Coverage Timeline Chart */}
      <div className="p-5 rounded-xl bg-[#0c0c0e] border border-zinc-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              24-Hour Global TCT Shift Heatmap
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Click any hour below to filter which members are awake during that specific Torn City Time shift.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Optimal (&ge;55%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>Moderate (25-54%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              <span>Vulnerable (&lt;25%)</span>
            </div>
          </div>
        </div>

        {/* Hourly Heatmap Columns */}
        <div className="grid grid-cols-6 sm:grid-cols-12 xl:grid-cols-[repeat(24,minmax(0,1fr))] gap-1.5 pt-2">
          {coverageData.map((slot) => {
            const isCurrent = slot.hour === currentTctHour;
            const isSelected = selectedHourHighlight === slot.hour;

            let barColor = "bg-emerald-500/80 hover:bg-emerald-400";
            let borderColor = "border-emerald-500/30";
            if (slot.riskLevel === "CRITICAL") {
              barColor = "bg-red-500/80 hover:bg-red-400";
              borderColor = "border-red-500/30";
            } else if (slot.riskLevel === "MODERATE") {
              barColor = "bg-amber-500/80 hover:bg-amber-400";
              borderColor = "border-amber-500/30";
            }

            return (
              <button
                key={slot.hour}
                onClick={() => setSelectedHourHighlight(isSelected ? null : slot.hour)}
                className={`relative p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-between h-24 ${
                  isSelected
                    ? "ring-2 ring-emerald-400 bg-zinc-800/80 border-emerald-400"
                    : isCurrent
                    ? "ring-1 ring-cyan-400 bg-cyan-950/20 border-cyan-500/50"
                    : `bg-zinc-900/60 ${borderColor} hover:bg-zinc-800/50`
                }`}
              >
                {/* Current Hour Indicator Badge */}
                {isCurrent && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1 py-0.2 bg-cyan-500 text-black text-[8px] font-bold uppercase rounded font-mono shadow-sm">
                    NOW
                  </span>
                )}

                <span className="text-[10px] font-mono text-zinc-400 font-semibold">{slot.label}</span>

                {/* Vertical bar gauge */}
                <div className="w-full bg-zinc-950 h-8 rounded-sm overflow-hidden flex flex-col justify-end p-0.5 my-1">
                  <div
                    className={`w-full rounded-xs transition-all ${barColor}`}
                    style={{ height: `${Math.max(slot.coverageRatio * 100, 10)}%` }}
                  />
                </div>

                <div className="flex flex-col items-center leading-none">
                  <span className="text-[11px] font-bold font-mono text-white tabular-nums">
                    {slot.awakeCount}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">awake</span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedHourHighlight !== null && (
          <div className="flex items-center justify-between p-2.5 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Filtering roster for <strong>{selectedHourHighlight.toString().padStart(2, "0")}:00 TCT shift</strong> ({coverageData[selectedHourHighlight]?.awakeCount} members awake).
              </span>
            </div>
            <button
              onClick={() => setSelectedHourHighlight(null)}
              className="text-xs underline hover:text-white"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* Roster Controls: Search & Multi-Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search member, ID, or timezone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-56 sm:w-64 font-mono transition-all"
            />
          </div>

          {/* Status Quick Filter Buttons */}
          <div className="inline-flex rounded-lg bg-zinc-900 p-0.5 border border-zinc-800 text-xs">
            {(
              [
                { id: "ALL", label: "All" },
                { id: "AWAKE", label: "☀️ Awake Now" },
                { id: "ASLEEP", label: "🌙 Asleep" },
                { id: "CHAIN_WATCH", label: "⚡ Chain Watch" },
                { id: "OC_READY", label: "🎯 OC Ready" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === tab.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* War Timing filter & Add Member */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 font-mono">War Pref:</span>
          <select
            value={warFilter}
            onChange={(e) => setWarFilter(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All War Availability</option>
            <option value="WEEKEND">Weekend Warriors</option>
            <option value="WEEKDAY">Weekday Fighters</option>
          </select>

          {isLeader && (
            <button
              onClick={handleOpenAddNewMember}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Faction Members Availability Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/70 border-b border-zinc-800/80 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Member & Position</th>
                <th className="px-4 py-3 whitespace-nowrap">Timezone & Local Clock</th>
                <th className="px-4 py-3 whitespace-nowrap">Awake Hours (TCT)</th>
                <th className="px-4 py-3 whitespace-nowrap">Chain Watch Duty (TCT)</th>
                <th className="px-4 py-3 whitespace-nowrap">War Preference</th>
                <th className="px-4 py-3 whitespace-nowrap">OC 2.0</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {isLoadingRoster ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500 font-mono text-xs">
                    <span className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 animate-spin text-emerald-400" />
                      Loading live faction roster...
                    </span>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500 font-mono text-xs">
                    {isLive && !userProfile?.factionId
                      ? "You are not currently in a faction. Join a faction in Torn to manage roster timezones."
                      : "No faction members matched your filter criteria."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isAwake = isMemberAwakeAtTct(member, currentTctHour);
                  const isOnChainDuty = isMemberOnChainWatchAtTct(member, currentTctHour);

                  // Calculate member's local time string with exact timezone and DST accuracy
                  const localTimeString = getMemberLocalTime(member.timezone, member.utcOffset, now);

                  // Convert awake local hours to TCT display string
                  const awakeStartTct = localHourToTctHour(member.awakeStartLocal, member.utcOffset);
                  const awakeEndTct = localHourToTctHour(member.awakeEndLocal, member.utcOffset);

                  return (
                    <tr
                      key={member.memberId}
                      className="hover:bg-zinc-900/40 transition-colors group"
                    >
                      {/* Name & Position */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-white font-mono">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${
                                member.lastActionStatus === "Online"
                                  ? "bg-emerald-400"
                                  : member.lastActionStatus === "Idle"
                                  ? "bg-amber-400"
                                  : "bg-zinc-600"
                              }`}
                              title={`In-game activity: ${member.lastActionStatus || "Offline"}`}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`https://www.torn.com/profiles.php?XID=${member.memberId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-white hover:text-emerald-400 transition-colors flex items-center gap-1"
                              >
                                {member.name}
                                <ExternalLink className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                              <span className="text-[10px] font-mono text-zinc-500">[{member.memberId}]</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
                                Lvl {member.level}
                              </span>
                              {member.position && (
                                <span className="text-[10px] text-zinc-400">{member.position}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Timezone & Local Clock */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {isAwake ? (
                            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                suppressHydrationWarning
                                className="font-bold font-mono text-white text-xs tabular-nums"
                              >
                                {localTimeString}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded font-mono ${
                                  isAwake
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                }`}
                              >
                                {isAwake ? "Awake" : "Asleep"}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{member.timezoneLabel}</p>
                          </div>
                        </div>
                      </td>

                      {/* Awake Hours in TCT */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-zinc-200">
                            {awakeStartTct.toString().padStart(2, "0")}:00 - {awakeEndTct.toString().padStart(2, "0")}:00 TCT
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            ({member.awakeStartLocal.toString().padStart(2, "0")}:00 - {member.awakeEndLocal.toString().padStart(2, "0")}:00 local)
                          </span>
                        </div>
                      </td>

                      {/* Chain Watch Duty in TCT */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-semibold text-blue-300">
                              {member.chainWatchStartTct.toString().padStart(2, "0")}:00 - {member.chainWatchEndTct.toString().padStart(2, "0")}:00 TCT
                            </span>
                            {isOnChainDuty && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                On Watch Duty Now
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* War Preference */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                            member.warPreference === "ALL"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : member.warPreference === "WEEKEND"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          <Swords className="w-3 h-3" />
                          {member.warPreference === "ALL"
                            ? "All Days"
                            : member.warPreference === "WEEKEND"
                            ? "Weekends"
                            : "Weekdays"}
                        </span>
                      </td>

                      {/* OC 2.0 Ready */}
                      <td className="px-4 py-3.5">
                        {member.ocReady ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-purple-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                            {member.ocPreferredTct && (
                              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                {member.ocPreferredTct}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-500">Off-duty</span>
                        )}
                      </td>

                      {/* Edit action */}
                      <td className="px-4 py-3.5 text-right">
                        {(isLeader || member.memberId === (userProfile?.playerId || 4552150)) && (
                          <button
                            onClick={() => handleOpenMemberEdit(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors text-[11px]"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Self-Service Modal */}
      {isModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[#0f0f12] border border-zinc-800 rounded-xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  {isNewMember
                    ? "Add Faction Member Availability"
                    : `Configure Timezone & Availability: ${editingMember.name}`}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* New Member Info Fields */}
              {isNewMember && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">Player Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ShadowViper"
                      value={editingMember.name}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">Player ID</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 4552150"
                      value={editingMember.memberId || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, memberId: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">Role / Position</label>
                    <input
                      type="text"
                      placeholder="e.g. Enforcer"
                      value={editingMember.position || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, position: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
              {/* Auto-detect button */}
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Auto-Detect From Browser
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Instantly fetch your computer's local timezone & UTC offset.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoDetectTimezone}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold transition-colors"
                >
                  Auto-Detect
                </button>
              </div>

              {/* Timezone Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Timezone Preset</label>
                <select
                  value={editingMember.timezone}
                  onChange={(e) => {
                    const found = GLOBAL_TIMEZONES_PRESET.find((p) => p.value === e.target.value);
                    if (found) {
                      setEditingMember({
                        ...editingMember,
                        timezone: found.value,
                        timezoneLabel: found.label,
                        utcOffset: found.offset,
                      });
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {GLOBAL_TIMEZONES_PRESET.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} (UTC{tz.offset >= 0 ? `+${tz.offset}` : tz.offset})
                    </option>
                  ))}
                </select>
              </div>

              {/* Local Awake Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Awake Start (Local)</label>
                  <select
                    value={editingMember.awakeStartLocal}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        awakeStartLocal: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00 Local
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Sleep Time (Local)</label>
                  <select
                    value={editingMember.awakeEndLocal}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        awakeEndLocal: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00 Local
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live TCT Awake Conversion Preview */}
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                <span>Calculated Global TCT Awake Window:</span>
                <span className="font-bold text-emerald-400">
                  {localHourToTctHour(editingMember.awakeStartLocal, editingMember.utcOffset)
                    .toString()
                    .padStart(2, "0")}
                  :00 -{" "}
                  {localHourToTctHour(editingMember.awakeEndLocal, editingMember.utcOffset)
                    .toString()
                    .padStart(2, "0")}
                  :00 TCT
                </span>
              </div>

              {/* Chain Watch Available Window (in TCT) */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  Chain Watch Active Hours (TCT)
                </label>
                <p className="text-[11px] text-zinc-400">
                  Designate hours when you are able to jump on Torn to save clutches and keep chains alive.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <select
                    value={editingMember.chainWatchStartTct}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        chainWatchStartTct: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00 TCT (Start)
                      </option>
                    ))}
                  </select>

                  <select
                    value={editingMember.chainWatchEndTct}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        chainWatchEndTct: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00 TCT (End)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preferred War Timing (Weekend / Weekday / All) */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  Preferred Ranked War Schedule
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "ALL", label: "All Days / Flexible" },
                      { id: "WEEKEND", label: "Weekends Only" },
                      { id: "WEEKDAY", label: "Weekdays Only" },
                    ] as const
                  ).map((pref) => (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => setEditingMember({ ...editingMember, warPreference: pref.id })}
                      className={`p-2 rounded-lg border text-xs font-medium text-center transition-colors ${
                        editingMember.warPreference === pref.id
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                      }`}
                    >
                      {pref.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* OC (Organized Crimes) Availability */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    Available for OC 2.0 Teams
                  </label>
                  <input
                    type="checkbox"
                    checked={editingMember.ocReady}
                    onChange={(e) => setEditingMember({ ...editingMember, ocReady: e.target.checked })}
                    className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                </div>
                {editingMember.ocReady && (
                  <input
                    type="text"
                    placeholder="Preferred execution window (e.g. 14:00 - 18:00 TCT)"
                    value={editingMember.ocPreferredTct || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, ocPreferredTct: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                >
                  Save Availability
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

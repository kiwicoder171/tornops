"use client";

import { useState, useEffect } from "react";
import { useTorn } from "@/context/TornContext";
import {
  CheckSquare,
  Clock,
  Sparkles,
  Zap,
  Target,
  Pill,
  Coins,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Award,
  ExternalLink,
} from "lucide-react";

interface DailyCheckItem {
  id: string;
  category: "REFILL" | "DRUGS" | "CASINO" | "CAREER" | "CITY";
  title: string;
  subtitle: string;
  resetType: "TCT_MIDNIGHT" | "COOLDOWN";
  link?: string;
  pointsCost?: string;
}

const DEFAULT_ROUTINES: DailyCheckItem[] = [
  {
    id: "energy_refill",
    category: "REFILL",
    title: "Daily Energy Refill (100-150E)",
    subtitle: "Available once per day via 25 Points or Donator status",
    resetType: "TCT_MIDNIGHT",
    pointsCost: "25 Points",
    link: "https://www.torn.com/points.php",
  },
  {
    id: "nerve_refill",
    category: "REFILL",
    title: "Daily Nerve Refill",
    subtitle: "Refill your natural nerve bar once per day",
    resetType: "TCT_MIDNIGHT",
    pointsCost: "25 Points",
    link: "https://www.torn.com/points.php",
  },
  {
    id: "xanax_1",
    category: "DRUGS",
    title: "Xanax Dose #1 (Morning Run)",
    subtitle: "+250 Energy • 6-8h Drug Cooldown",
    resetType: "COOLDOWN",
    link: "https://www.torn.com/item.php#drugs-items",
  },
  {
    id: "xanax_2",
    category: "DRUGS",
    title: "Xanax Dose #2 (Midday Run)",
    subtitle: "+250 Energy • Keep cooldown rolling without overdose loss",
    resetType: "COOLDOWN",
    link: "https://www.torn.com/item.php#drugs-items",
  },
  {
    id: "xanax_3",
    category: "DRUGS",
    title: "Xanax Dose #3 (Evening Run / Overnight)",
    subtitle: "+250 Energy • Maximum daily training velocity (750E)",
    resetType: "COOLDOWN",
    link: "https://www.torn.com/item.php#drugs-items",
  },
  {
    id: "wheel_awesome",
    category: "CASINO",
    title: "Wheel of Awesome ($1,000,000)",
    subtitle: "Leslie's top wheel: chance for Private Island, FHC, or Stat Enhancer",
    resetType: "TCT_MIDNIGHT",
    link: "https://www.torn.com/loader.php?sid=viewWheels",
  },
  {
    id: "wheel_mediocrity",
    category: "CASINO",
    title: "Wheel of Mediocrity ($50,000)",
    subtitle: "Chance for Donator Packs, Points, or plushies",
    resetType: "TCT_MIDNIGHT",
    link: "https://www.torn.com/loader.php?sid=viewWheels",
  },
  {
    id: "wheel_lame",
    category: "CASINO",
    title: "Wheel of Lame ($1,000)",
    subtitle: "Cheap daily spin for basic items and merits",
    resetType: "TCT_MIDNIGHT",
    link: "https://www.torn.com/loader.php?sid=viewWheels",
  },
  {
    id: "russian_roulette",
    category: "CASINO",
    title: "Daily Russian Roulette Duel",
    subtitle: "High-adrenaline 1v1 coin wager or 6-shooter duel",
    resetType: "TCT_MIDNIGHT",
    link: "https://www.torn.com/loader.php?sid=viewRussianRoulette",
  },
  {
    id: "company_trains",
    category: "CAREER",
    title: "Company Director / Employee Trains",
    subtitle: "Receive daily stat trains from 10* company director",
    resetType: "TCT_MIDNIGHT",
    link: "https://www.torn.com/companies.php",
  },
  {
    id: "education_check",
    category: "CAREER",
    title: "Education Course Progress",
    subtitle: "Ensure active course enrollment and timer hasn't expired",
    resetType: "COOLDOWN",
    link: "https://www.torn.com/education.php",
  },
  {
    id: "city_finds",
    category: "CITY",
    title: "City Map Item Inspection",
    subtitle: "Check city map for free spawned cash, weapons, or cans",
    resetType: "TCT_MIDNIGHT",
    link: "https://www.torn.com/city.php",
  },
  {
    id: "duke_contract",
    category: "CITY",
    title: "Duke Daily Mission",
    subtitle: "Complete active mission for mission credits and weapon caches",
    resetType: "TCT_MIDNIGHT",
    link: "https://www.torn.com/missions.php",
  },
];

interface CustomObjective {
  id: string;
  text: string;
  done: boolean;
}

const STORAGE_CHECKED_KEY = "TORN_DAILY_ROUTINE_CHECKED";
const STORAGE_DATE_KEY = "TORN_DAILY_ROUTINE_DATE";
const STORAGE_CUSTOM_KEY = "TORN_CUSTOM_DAILY_OBJECTIVES";

export default function DailyRoutinePage() {
  const { userProfile, isLive } = useTorn();
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [customTasks, setCustomTasks] = useState<CustomObjective[]>([]);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [timeUntilMidnight, setTimeUntilMidnight] = useState<string>("00:00:00");
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate live countdown to TCT Midnight (00:00:00 UTC)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentUtcHours = now.getUTCHours();
      const currentUtcMinutes = now.getUTCMinutes();
      const currentUtcSeconds = now.getUTCSeconds();

      const totalSecLeft =
        24 * 3600 - (currentUtcHours * 3600 + currentUtcMinutes * 60 + currentUtcSeconds);

      const h = Math.floor(totalSecLeft / 3600).toString().padStart(2, "0");
      const m = Math.floor((totalSecLeft % 3600) / 60).toString().padStart(2, "0");
      const s = (totalSecLeft % 60).toString().padStart(2, "0");
      setTimeUntilMidnight(`${h}:${m}:${s}`);

      // Auto reset if new TCT calendar day has arrived
      const todayDateStr = now.toISOString().slice(0, 10);
      const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
      if (savedDate && savedDate !== todayDateStr) {
        // New day! Clear midnight reset items
        setCheckedMap((prev) => {
          const fresh: Record<string, boolean> = {};
          // Preserve COOLDOWN items if checked recently, clear TCT_MIDNIGHT
          DEFAULT_ROUTINES.forEach((r) => {
            if (r.resetType === "COOLDOWN" && prev[r.id]) {
              fresh[r.id] = true;
            }
          });
          localStorage.setItem(STORAGE_CHECKED_KEY, JSON.stringify(fresh));
          return fresh;
        });
        localStorage.setItem(STORAGE_DATE_KEY, todayDateStr);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedChecked = localStorage.getItem(STORAGE_CHECKED_KEY);
      if (savedChecked) setCheckedMap(JSON.parse(savedChecked));

      const savedCustom = localStorage.getItem(STORAGE_CUSTOM_KEY);
      if (savedCustom) setCustomTasks(JSON.parse(savedCustom));

      const todayDateStr = new Date().toISOString().slice(0, 10);
      const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
      if (!savedDate) {
        localStorage.setItem(STORAGE_DATE_KEY, todayDateStr);
      }
    } catch {
      // Ignore
    }
    setIsInitialized(true);
  }, []);

  // Persist check status
  const toggleRoutine = (id: string) => {
    setCheckedMap((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_CHECKED_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Persist custom tasks
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(customTasks));
    }
  }, [customTasks, isInitialized]);

  const addCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setCustomTasks((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, text: newTaskInput.trim(), done: false },
    ]);
    setNewTaskInput("");
  };

  const toggleCustomTask = (id: string) => {
    setCustomTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteCustomTask = (id: string) => {
    setCustomTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const resetAllToday = () => {
    if (confirm("Reset all routine checkmarks for today?")) {
      setCheckedMap({});
      localStorage.setItem(STORAGE_CHECKED_KEY, JSON.stringify({}));
    }
  };

  // Metrics
  const totalRoutines = DEFAULT_ROUTINES.length;
  const completedRoutines = DEFAULT_ROUTINES.filter((r) => checkedMap[r.id]).length;
  const routinePct = Math.round((completedRoutines / totalRoutines) * 100);

  const categories = [
    { id: "REFILL", label: "Energy & Nerve Refills", icon: Zap, color: "text-amber-400" },
    { id: "DRUGS", label: "Xanax 3x Rotation", icon: Pill, color: "text-purple-400" },
    { id: "CASINO", label: "Leslie's Wheels & Casino", icon: Coins, color: "text-emerald-400" },
    { id: "CAREER", label: "Company & Education", icon: Briefcase, color: "text-blue-400" },
    { id: "CITY", label: "City Finds & Missions", icon: Target, color: "text-red-400" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header with Live Countdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#0c0c0e] border border-[#1e1e24] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Torn Daily Routine & Reset Tracker
              </h1>
              <p className="text-xs text-zinc-400">
                Automated check-in ledger for daily energy refills, wheels, Xanax stacks, and company trains.
              </p>
            </div>
          </div>
        </div>

        {/* Midnight Reset Clock & Controls */}
        <div className="flex items-center gap-3">
          <div className="bg-[#121216] border border-[#232329] px-3 py-2 rounded-lg text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 justify-end">
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>TCT Midnight Reset</span>
            </div>
            <div className="text-base font-mono font-bold text-amber-300 tabular-nums">
              {timeUntilMidnight}
            </div>
          </div>

          <button
            onClick={resetAllToday}
            className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-[#141418] hover:bg-[#1a1a20] border border-[#222228] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset today's checks"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div className="p-4 rounded-xl bg-[#0e0e12] border border-[#1f1f26]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" />
            Daily Routine Completion
          </span>
          <span className="font-mono text-emerald-400 font-bold tabular-nums">
            {completedRoutines}/{totalRoutines} Done ({routinePct}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-[#17171d] rounded-full overflow-hidden p-0.5 border border-[#24242d]">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${routinePct}%` }}
          />
        </div>
      </div>

      {/* Routine Modules by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map((cat) => {
          const items = DEFAULT_ROUTINES.filter((r) => r.category === cat.id);
          const CatIcon = cat.icon;

          return (
            <div
              key={cat.id}
              className="rounded-xl bg-[#0c0c0f] border border-[#1b1b22] p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#18181f]">
                  <CatIcon className={`w-4 h-4 ${cat.color}`} />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    {cat.label}
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {items.map((item) => {
                    const isChecked = !!checkedMap[item.id];

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleRoutine(item.id)}
                        className={`group flex items-start justify-between gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-emerald-950/20 border-emerald-800/40 opacity-70"
                            : "bg-[#111116] border-[#202028] hover:border-[#2e2e38] hover:bg-[#15151c]"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by parent div click
                            className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                          <div>
                            <div
                              className={`text-xs font-medium leading-tight ${
                                isChecked ? "text-zinc-400 line-through" : "text-white"
                              }`}
                            >
                              {item.title}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>

                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-600 hover:text-sky-400 transition-colors p-1"
                            title="Open in Torn"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Member Objectives / Notes Backlog */}
      <div className="p-5 rounded-xl bg-[#0c0c0f] border border-[#1b1b22]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          Custom Member Objectives & Notes
        </h3>

        {/* Task Input Form */}
        <form onSubmit={addCustomTask} className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Add custom task (e.g. 'Sell 100 plushies to trader', 'Train 400 Defense', 'Vault $10m')..."
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            className="flex-1 bg-[#121216] border border-[#202028] focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Custom Task List */}
        {customTasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-[#1f1f26] rounded-lg">
            No custom objectives added yet. Type an objective above to keep track of personal goals.
          </div>
        ) : (
          <div className="space-y-1.5">
            {customTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 p-2 rounded-lg bg-[#111115] border border-[#1e1e26]"
              >
                <div
                  onClick={() => toggleCustomTask(t.id)}
                  className="flex items-center gap-2.5 flex-1 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggleCustomTask(t.id)}
                    className="rounded border-zinc-700 bg-zinc-900 text-sky-500 focus:ring-0 cursor-pointer"
                  />
                  <span
                    className={`text-xs ${
                      t.done ? "text-zinc-500 line-through" : "text-zinc-200"
                    }`}
                  >
                    {t.text}
                  </span>
                </div>
                <button
                  onClick={() => deleteCustomTask(t.id)}
                  className="text-zinc-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                  title="Delete objective"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Swords,
  Clock,
  HeartPulse,
  Calculator,
  Shield,
  Users,
  Building2,
  Plane,
  Target,
  CheckSquare,
  Zap,
  Settings,
  ExternalLink,
  Command,
} from "lucide-react";

interface PaletteItem {
  id: string;
  title: string;
  category: "WAR" | "FACTION" | "RECRUITING" | "CITIZEN" | "ACCESS" | "TORN";
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  isExternal?: boolean;
}

const ITEMS: PaletteItem[] = [
  // War
  { id: "war", title: "Ranked War Room", category: "WAR", icon: Swords, href: "/war" },
  { id: "heatmap", title: "Enemy Sleep Heatmap & Push Radar", category: "WAR", icon: Clock, href: "/heatmap" },
  { id: "revives", title: "War Revive Dispatch Board", category: "WAR", icon: HeartPulse, href: "/revives" },
  { id: "payout", title: "Fair-Share War Payout Engine", category: "WAR", icon: Calculator, href: "/payout" },

  // Faction
  { id: "armory", title: "Armory & Loaner Item Tracker", category: "FACTION", icon: Shield, href: "/armory" },
  { id: "oc", title: "Crimes 2.0 Planner", category: "FACTION", icon: Users, href: "/oc" },
  { id: "banking", title: "Vault & Banking Ledger", category: "FACTION", icon: Building2, href: "/banking" },

  // Recruiting
  { id: "recruitment", title: "Faction Recruitment Radar", category: "RECRUITING", icon: Users, href: "/recruitment" },

  // Citizen
  { id: "travel", title: "Travel Safe-Landing & Stock Radar", category: "CITIZEN", icon: Plane, href: "/travel" },
  { id: "targets", title: "Baldr Leveling Targets (384 Targets)", category: "CITIZEN", icon: Target, href: "/targets" },
  { id: "todo", title: "Faction Task Board", category: "CITIZEN", icon: CheckSquare, href: "/todo" },

  // Access
  { id: "pricing", title: "Plans & Xanax Subscription Passes", category: "ACCESS", icon: Zap, href: "/pricing" },
  { id: "settings", title: "System Settings & Key Pool", category: "ACCESS", icon: Settings, href: "/settings" },

  // Torn In-Game Shortcuts
  { id: "torn-home", title: "Open Torn City In-Game", category: "TORN", icon: ExternalLink, href: "https://www.torn.com/index.php", isExternal: true },
  { id: "torn-travel", title: "Open Torn Travel Agency", category: "TORN", icon: ExternalLink, href: "https://www.torn.com/travelagency.php", isExternal: true },
  { id: "torn-armory", title: "Open Torn Faction Armory", category: "TORN", icon: ExternalLink, href: "https://www.torn.com/factions.php?step=your#/tab=armoury", isExternal: true },
  { id: "torn-drugs", title: "Open Torn Drug Inventory (Xanax)", category: "TORN", icon: ExternalLink, href: "https://www.torn.com/item.php#drugs", isExternal: true },
];

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Toggle on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredItems = ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      setIsOpen(false);
      setQuery("");
      if (!item.href) return;

      if (item.isExternal) {
        window.open(item.href, "_blank", "noopener,noreferrer");
      } else {
        router.push(item.href);
      }
    },
    [router]
  );

  // Keyboard navigation within list
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 p-4 animate-in fade-in">
      <div
        className="bg-[#0f0f13] border border-[#2a2a32] rounded-xl max-w-xl w-full shadow-2xl overflow-hidden"
        onKeyDown={handleListKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#222226] flex items-center gap-3">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            autoFocus
            type="text"
            id="commandPaletteInput"
            name="commandPaletteInput"
            aria-label="Search operations or actions"
            placeholder="Search operations, tools, or Torn shortcuts..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181c] border border-[#27272a] text-[10px] text-zinc-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              No matching modules or actions found.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full p-2.5 rounded-lg text-left flex items-center justify-between transition-colors text-xs ${
                    isSelected ? "bg-blue-600 text-white" : "text-zinc-300 hover:bg-[#18181c]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-zinc-400"}`} />
                    <span className="font-medium">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                        isSelected ? "bg-white/20 text-white" : "bg-[#18181c] text-zinc-500 border border-[#24242a]"
                      }`}
                    >
                      {item.category}
                    </span>
                    {item.isExternal && (
                      <ExternalLink className={`w-3 h-3 ${isSelected ? "text-white" : "text-zinc-500"}`} />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-3.5 py-2 border-t border-[#222226] bg-[#0c0c0e] flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
          <span className="flex items-center gap-1 font-mono text-[10px] text-blue-400">
            <Command className="w-3 h-3" /> TornOps Quick Nav
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Swords,
  Calculator,
  Users,
  Landmark,
  Target,
  Kanban,
  Settings,
  Flame,
  Shield,
  Activity,
  Zap,
  Moon,
  HeartPulse,
  ShieldAlert,
  UserPlus,
  Plane,
  Tag,
  Globe,
  X,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";
import { formatChainTime } from "@torn/shared";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  badgeVariant?: "red" | "purple" | "emerald" | "blue" | "amber" | "zinc";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "WAR & COMBAT",
    items: [
      { name: "War Room", href: "/war", icon: Swords, badge: "LIVE", badgeVariant: "red" },
      { name: "Spy Vault", href: "/spies", icon: Target, badge: "INTEL", badgeVariant: "blue" },
      { name: "Enemy Sleep Radar", href: "/heatmap", icon: Moon },
      { name: "Revive Dispatch", href: "/revives", icon: HeartPulse },
      { name: "Payout Engine", href: "/payout", icon: Calculator },
    ],
  },
  {
    title: "FACTION OPERATIONS",
    items: [
      { name: "Timezones & Shifts", href: "/coverage", icon: Globe, badge: "NEW", badgeVariant: "emerald" },
      { name: "OC 2.0 Optimizer", href: "/oc", icon: Users },
      { name: "Armory & Loaners", href: "/armory", icon: ShieldAlert },
      { name: "Vault & Banking", href: "/banking", icon: Landmark },
      { name: "Recruitment Radar", href: "/recruitment", icon: UserPlus },
    ],
  },
  {
    title: "CITIZEN TOOLS",
    items: [
      { name: "Travel & Stock", href: "/travel", icon: Plane },
      { name: "Leveling Targets", href: "/targets", icon: Target },
      { name: "Task Board", href: "/todo", icon: Kanban },
    ],
  },
  {
    title: "SYSTEM & SETTINGS",
    items: [
      { name: "Free Access & Roadmap", href: "/pricing", icon: Tag },
      { name: "Settings & API Keys", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isLive, apiKey, userProfile, isMobileSidebarOpen, setIsMobileSidebarOpen } = useTorn();

  // Persistent live chain ticker in sidebar
  const [chainCount, setChainCount] = useState<number>(0);
  const [chainTimeout, setChainTimeout] = useState<number>(0);
  const [chainMax, setChainMax] = useState<number>(10);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname, setIsMobileSidebarOpen]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileSidebarOpen, setIsMobileSidebarOpen]);

  useEffect(() => {
    if (!isLive || !apiKey) {
      setChainCount(0);
      setChainTimeout(0);
      return;
    }

    let isMounted = true;
    const fetchChainMini = async () => {
      try {
        const res = await fetch(`/api/torn/faction?selections=chain&key=${encodeURIComponent(apiKey)}`);
        const data = await res.json();
        if (data.chain && isMounted) {
          setChainCount(data.chain.current || 0);
          setChainTimeout(data.chain.timeout || 0);
          setChainMax(data.chain.max || 10);
        }
      } catch {
        // Silently retain state
      }
    };

    fetchChainMini();
    const interval = setInterval(fetchChainMini, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLive, apiKey]);

  // Timeout countdown local ticker
  useEffect(() => {
    if (chainTimeout <= 0) return;
    const timer = setInterval(() => {
      setChainTimeout((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [chainTimeout]);

  const isChainActive = chainCount > 0 && chainTimeout > 0;
  const isEmergency = isChainActive && chainTimeout <= 60;
  const isWarning = isChainActive && chainTimeout <= 120 && chainTimeout > 60;

  const getBadgeClass = (variant?: string) => {
    switch (variant) {
      case "red":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "purple":
        return "bg-purple-500/10 text-purple-300 border border-purple-500/20";
      case "emerald":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "blue":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      default:
        return "bg-[#18181b] text-zinc-400 border border-[#27272a]";
    }
  };

  const renderContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="px-4 py-3.5 border-b border-[#1a1a1d] flex items-center justify-between">
        <Link
          href="/"
          onClick={() => isMobile && setIsMobileSidebarOpen(false)}
          className="flex items-center gap-2 group"
        >
          <div className="w-6 h-6 rounded-md bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:border-blue-500/40 transition-colors">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-white text-xs tracking-tight">TORN</span>
            <span className="font-bold text-blue-400 text-xs tracking-tight">OPS</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-[#121215] border border-[#222225] shrink-0">
            {userProfile?.factionId ? `#${userProfile.factionId}` : "#57693"}
          </span>
          {isMobile && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#16161a] rounded-md transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categorized Navigation List */}
      <nav className="flex-1 px-2.5 py-3 space-y-3.5 overflow-y-auto custom-scrollbar">
        {/* Primary Hub Overview */}
        <div className="pb-1.5 border-b border-[#18181b]">
          <Link
            href="/"
            onClick={() => isMobile && setIsMobileSidebarOpen(false)}
            className={`group flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors duration-100 ${
              pathname === "/"
                ? "bg-[#151519] text-white font-medium border border-[#26262b] shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#101013] border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Flame
                className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                  pathname === "/" ? "text-amber-400" : "text-zinc-500 group-hover:text-amber-400"
                }`}
              />
              <span className="truncate font-medium">Overview</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">HUB</span>
          </Link>
        </div>

        {navSections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <div className="px-2 py-1 text-[9px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => isMobile && setIsMobileSidebarOpen(false)}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors duration-100 ${
                    isActive
                      ? "bg-[#151519] text-white font-medium border border-[#26262b] shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#101013] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-400"
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-1 py-0.2 rounded text-[9px] font-mono font-medium shrink-0 ${getBadgeClass(
                        item.badgeVariant
                      )}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Minimalist Chain Telemetry Widget */}
      <div className="p-2.5 border-t border-[#1a1a1d] bg-[#08080a]">
        <Link
          href="/war"
          onClick={() => isMobile && setIsMobileSidebarOpen(false)}
          className={`block p-2 rounded-md border transition-all ${
            isEmergency
              ? "bg-red-950/20 border-red-500/40 text-red-200"
              : isWarning
              ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
              : isChainActive
              ? "bg-[#0e0e11] border-[#222225] text-zinc-300 hover:border-blue-500/30"
              : "bg-[#0c0c0e] border-[#1c1c1f] text-zinc-400 hover:border-[#2a2a2e]"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300">
              <Activity className={`w-3 h-3 ${isChainActive ? "text-blue-400" : "text-zinc-500"}`} />
              Chain Status
            </span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                isEmergency
                  ? "bg-red-500/20 text-red-300 font-bold"
                  : isWarning
                  ? "bg-amber-500/20 text-amber-300 font-bold"
                  : isChainActive
                  ? "bg-blue-500/10 text-blue-300 font-semibold"
                  : "text-zinc-400 font-normal"
              }`}
            >
              {isChainActive ? `#${chainCount}` : "Standby"}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Timeout:</span>
            <span className={`font-semibold tabular-nums ${isEmergency ? "text-red-400" : isWarning ? "text-amber-400" : "text-zinc-200"}`}>
              {isChainActive ? formatChainTime(chainTimeout) : "00:00"}
            </span>
          </div>

          <div className="w-full bg-[#18181b] h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isEmergency ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{
                width: isChainActive ? `${Math.min(100, (chainTimeout / 300) * 100)}%` : "0%",
              }}
            />
          </div>
        </Link>
      </div>

      {/* Footer Status Bar */}
      <div className="px-3 py-2 border-t border-[#1a1a1d] bg-[#050506] flex flex-col gap-1 text-[10px] text-zinc-400">
        <div className="flex items-center justify-between">
          <span className="font-mono flex items-center gap-1 text-zinc-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
            {isLive ? "Live API" : "Demo Mode"}
          </span>
          <Link
            href="/pricing"
            onClick={() => isMobile && setIsMobileSidebarOpen(false)}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            100% Free Access
          </Link>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-[#141416] text-[9px] text-zinc-400">
          <span>Created by</span>
          <a
            href="https://www.torn.com/profiles.php?XID=4552150"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-300 hover:text-amber-400 font-mono transition-colors"
          >
            NongGuyver [4552150]
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-60 bg-[#08080a] border-r border-[#1a1a1d] flex-col h-screen sticky top-0 select-none z-30 shrink-0">
        {renderContent(false)}
      </aside>

      {/* Mobile / Tablet Drawer Overlay & Panel */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-[#08080a] border-r border-[#1a1a1d] flex flex-col h-full z-50 shadow-2xl animate-in slide-in-from-left duration-200 select-none">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}

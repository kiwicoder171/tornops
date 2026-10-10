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
} from "lucide-react";
import { useTorn } from "@/context/TornContext";
import { formatChainTime } from "@torn/shared";

const navigation = [
  { name: "Overview", href: "/", icon: Flame },
  { name: "War Room", href: "/war", icon: Swords, badge: "LIVE" },
  { name: "Payout Calculator", href: "/payout", icon: Calculator },
  { name: "OC 2.0 Optimizer", href: "/oc", icon: Users },
  { name: "Vault & Banking", href: "/banking", icon: Landmark },
  { name: "Leveling Targets", href: "/targets", icon: Target, badge: "384" },
  { name: "Task Board", href: "/todo", icon: Kanban },
  { name: "Settings & Keys", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isLive, apiKey, userProfile } = useTorn();

  // Persistent live chain ticker in sidebar
  const [chainCount, setChainCount] = useState<number>(0);
  const [chainTimeout, setChainTimeout] = useState<number>(0);
  const [chainMax, setChainMax] = useState<number>(10);

  useEffect(() => {
    if (!isLive || !apiKey) {
      // Demo mock state
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

  return (
    <aside className="w-64 bg-black border-r border-[#222225] flex flex-col h-screen sticky top-0 select-none z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#222225] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm tracking-wide">TORN</span>
              <span className="font-extrabold text-blue-400 text-sm tracking-wide">OPS</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
              {userProfile?.factionName ? `${userProfile.factionName}` : "Mildly Dangerous"}
            </p>
          </div>
        </div>

        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141416] border border-[#27272a] text-blue-400">
          MD#57693
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-[#141417] border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                    item.badge === "LIVE"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-[#18181b] text-zinc-400 border border-[#27272a]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Persistent Chain Telemetry Mini-Widget */}
      <div className="p-3 border-t border-[#1c1c1f] bg-black">
        <Link
          href="/war"
          className={`block p-3 rounded-lg border transition-all ${
            isEmergency
              ? "bg-red-950/40 border-red-500/50 hover:border-red-400 shadow-md shadow-red-950/30 animate-pulse"
              : isWarning
              ? "bg-amber-950/30 border-amber-500/40 hover:border-amber-300"
              : isChainActive
              ? "bg-[#0d0d0f] border-[#222225] hover:border-blue-500/50"
              : "bg-[#0d0d0f] border-[#222225] hover:border-[#3f3f46]"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-zinc-300 text-[11px]">
              <Activity className={`w-3.5 h-3.5 ${isChainActive ? "text-blue-400" : "text-zinc-500"}`} />
              Chain Status
            </span>
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isEmergency
                  ? "bg-red-500/30 text-red-300"
                  : isWarning
                  ? "bg-amber-500/30 text-amber-300"
                  : isChainActive
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-[#18181b] text-zinc-400 border border-[#27272a]"
              }`}
            >
              {isChainActive ? `#${chainCount}` : "INACTIVE"}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Timeout:</span>
            <span className={`font-bold tabular-nums ${isEmergency ? "text-red-400" : isWarning ? "text-amber-400" : "text-zinc-100"}`}>
              {isChainActive ? formatChainTime(chainTimeout) : "00:00"}
            </span>
          </div>

          {/* Mini Timeout Progress Bar */}
          <div className="w-full bg-[#1c1c1f] h-1 rounded-full mt-2 overflow-hidden">
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

      {/* API Rate Limit Capacity Meter */}
      <div className="px-4 py-3 border-t border-[#1c1c1f] bg-black flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>API Pool</span>
        </div>
        <span className="font-mono text-zinc-300 text-[10px]">
          {isLive ? "100 req/m (Active)" : "Demo Mode"}
        </span>
      </div>
    </aside>
  );
}

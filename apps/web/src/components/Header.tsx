"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTorn } from "@/context/TornContext";
import { Key, ShieldCheck, LogOut, Loader2, AlertCircle, Search, Clock, Menu } from "lucide-react";

export function Header() {
  const { maskedKey, isLive, isLoading, userProfile, error, saveApiKey, disconnect, toggleMobileSidebar } = useTorn();
  const [inputKey, setInputKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tctClock, setTctClock] = useState<string>("00:00:00");

  useEffect(() => {
    const updateTct = () => {
      const d = new Date();
      const h = d.getUTCHours().toString().padStart(2, "0");
      const m = d.getUTCMinutes().toString().padStart(2, "0");
      const s = d.getUTCSeconds().toString().padStart(2, "0");
      setTctClock(`${h}:${m}:${s}`);
    };
    updateTct();
    const timer = setInterval(updateTct, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setIsSubmitting(true);
    await saveApiKey(inputKey);
    setIsSubmitting(false);
    setInputKey("");
  };

  return (
    <header className="bg-[#08080a]/95 backdrop-blur-md border-b border-[#1a1a1d] px-3 sm:px-6 py-2.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5 sticky top-0 z-30 select-none">
      {/* Left: Hamburger (mobile), Mode Indicator & Live TCT Clock */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          onClick={toggleMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-[#16161a] rounded-md border border-[#222225] transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        {isLive ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-tight text-[11px] font-semibold">LIVE API</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
            <span className="tracking-tight text-[11px] font-semibold">DEMO MODE</span>
          </div>
        )}

        {/* Live Torn City Time (TCT) Clock Pill */}
        <Link
          href="/coverage"
          title="Torn City Time (Click to open Timezone & Shift Coverage Hub)"
          className="inline-flex items-center gap-1.5 px-2 py-0.8 sm:px-2.5 sm:py-1 rounded-md bg-[#0e0e11] hover:bg-[#151519] border border-[#222225] hover:border-emerald-500/40 text-xs font-mono text-emerald-400 tabular-nums transition-colors"
        >
          <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span suppressHydrationWarning className="text-[11px] sm:text-xs">{tctClock}</span>
          <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase">TCT</span>
        </Link>

        {error && (
          <span className="hidden sm:flex text-xs text-red-400 items-center gap-1.5 font-mono bg-red-950/30 border border-red-900/50 px-2 py-0.5 rounded truncate max-w-[200px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" /> {error}
          </span>
        )}

        {/* Command Palette Trigger (Desktop) */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0e0e11] hover:bg-[#151519] border border-[#222225] hover:border-[#2f2f35] text-xs text-zinc-400 hover:text-white transition-colors"
          title="Open Command Palette (Cmd+K)"
        >
          <Search className="w-3 h-3 text-zinc-500" />
          <span className="text-[11px]">Search</span>
          <kbd className="text-[10px] bg-[#16161a] px-1 py-0.2 rounded border border-[#27272a] font-mono text-zinc-400">
            ⌘K
          </kbd>
        </button>

        {/* Command Palette Trigger (Mobile Icon) */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="lg:hidden p-1.5 text-zinc-400 hover:text-white bg-[#0e0e11] border border-[#222225] rounded-md transition-colors"
          title="Search & Actions"
          aria-label="Open Command Palette"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: User Identity, Live Vitals & API Key Controls */}
      <div className="flex items-center gap-2">
        {isLive && userProfile ? (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            {/* Live Character Vitals (Energy / Nerve / Life) */}
            {userProfile.energy && (
              <div className="hidden lg:flex items-center gap-2 bg-[#0e0e11] border border-[#222225] px-2 py-1 rounded-md text-[11px] font-mono">
                {/* Energy */}
                <div className="flex items-center gap-1 text-emerald-400" title="Current Energy">
                  <span className="text-[10px]">⚡</span>
                  <span className="tabular-nums font-semibold">{userProfile.energy.current}/{userProfile.energy.max}</span>
                </div>
                {/* Nerve */}
                {userProfile.nerve && (
                  <div className="flex items-center gap-1 text-red-400 border-l border-[#222225] pl-1.5" title="Current Nerve">
                    <span className="text-[10px]">🎯</span>
                    <span className="tabular-nums font-semibold">{userProfile.nerve.current}/{userProfile.nerve.max}</span>
                  </div>
                )}
                {/* Life */}
                {userProfile.life && (
                  <div className="flex items-center gap-1 text-blue-400 border-l border-[#222225] pl-1.5" title="Current Life">
                    <span className="text-[10px]">❤️</span>
                    <span className="tabular-nums font-semibold">{userProfile.life.current}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-[#0e0e11] border border-[#222225] px-2 sm:px-2.5 py-1 rounded-md max-w-[200px] sm:max-w-none truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="flex items-center gap-1 text-zinc-200 text-xs truncate">
                <span className="font-medium text-white truncate">{userProfile.name}</span>
                <span className="text-zinc-500 font-mono tabular-nums text-[11px]">[{userProfile.playerId}]</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1.5 font-mono text-zinc-400 bg-[#0e0e11] px-2 py-1 rounded-md border border-[#222225] tabular-nums text-xs">
              <Key className="w-3 h-3 text-zinc-500" />
              <span>{maskedKey}</span>
            </div>

            <button
              onClick={disconnect}
              title="Disconnect API key and return to demo mode"
              className="inline-flex items-center gap-1 px-2 py-1 bg-[#0e0e11] hover:bg-red-950/30 text-zinc-400 hover:text-red-400 rounded-md border border-[#222225] hover:border-red-900/50 transition-colors text-xs"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Disconnect</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Key className="w-3 h-3 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                id="headerApiKey"
                name="headerApiKey"
                aria-label="Paste Torn API Key"
                type="password"
                autoComplete="off"
                placeholder="Paste Torn API Key..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="bg-[#0e0e11] border border-[#222225] rounded-md pl-7 pr-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 w-36 xs:w-44 sm:w-56 md:w-60 font-mono transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-xs font-medium transition-colors shrink-0"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> <span className="hidden sm:inline">Verifying...</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Connect</span>
                  <span className="hidden sm:inline">Connect Live</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </header>
  );
}

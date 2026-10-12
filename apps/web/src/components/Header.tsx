"use client";

import { useState } from "react";
import { useTorn } from "@/context/TornContext";
import { Key, ShieldCheck, LogOut, Loader2, AlertCircle } from "lucide-react";

export function Header() {
  const { maskedKey, isLive, isLoading, userProfile, error, saveApiKey, disconnect } = useTorn();
  const [inputKey, setInputKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setIsSubmitting(true);
    await saveApiKey(inputKey);
    setIsSubmitting(false);
    setInputKey("");
  };

  return (
    <header className="bg-black/90 backdrop-blur-md border-b border-[#222225] px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sticky top-0 z-30">
      {/* Left: Mode Indicator */}
      <div className="flex items-center gap-3">
        {isLive ? (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide">API TELEMETRY LIVE</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="tracking-wide">DEMO PREVIEW MODE</span>
          </div>
        )}

        {error && (
          <span className="text-xs text-red-400 flex items-center gap-1.5 font-mono bg-red-950/40 border border-red-900/60 px-2 py-0.5 rounded">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" /> {error}
          </span>
        )}
      </div>

      {/* Right: User Identity & API Key Controls */}
      <div>
        {isLive && userProfile ? (
          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex items-center gap-2 bg-[#0d0d0f] border border-[#222225] px-3 py-1.5 rounded-lg shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex items-center gap-1.5 text-zinc-200">
                <span className="font-semibold text-white">{userProfile.name}</span>
                <span className="text-zinc-500 font-mono tabular-nums">[{userProfile.playerId}]</span>
                {userProfile.factionName && (
                  <span className="text-zinc-400 border-l border-[#222225] pl-1.5 ml-0.5">
                    {userProfile.factionName} &bull; {userProfile.position || "Member"}
                  </span>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 font-mono text-zinc-400 bg-[#0d0d0f] px-2.5 py-1.5 rounded-lg border border-[#222225] tabular-nums">
              <Key className="w-3.5 h-3.5 text-zinc-500" />
              <span>{maskedKey}</span>
            </div>

            <button
              onClick={disconnect}
              title="Disconnect API key and return to demo mode"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0d0d0f] hover:bg-red-950/60 text-zinc-400 hover:text-red-400 rounded-lg border border-[#222225] hover:border-red-900/60 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Key className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                id="headerApiKey"
                name="headerApiKey"
                aria-label="Paste Torn API Key"
                type="password"
                autoComplete="off"
                placeholder="Paste Torn API Key..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="bg-[#0d0d0f] border border-[#222225] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 w-56 sm:w-64 font-mono transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-sm"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                </>
              ) : (
                <>Connect Live</>
              )}
            </button>
          </form>
        )}
      </div>
    </header>
  );
}

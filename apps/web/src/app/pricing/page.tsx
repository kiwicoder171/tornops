"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Tag,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  Heart,
  ExternalLink,
  Users,
  Copy,
  Clock,
  Swords,
  Moon,
  HeartPulse,
  Calculator,
  ShieldAlert,
  Plane,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";

export default function PricingPage() {
  const { userProfile, isLive } = useTorn();
  const [copied, setCopied] = useState<boolean>(false);

  // Creator details for optional tips & support
  const creatorName = "NongGuyver";
  const creatorId = 4552150;

  const handleCopyName = () => {
    navigator.clipboard.writeText(`${creatorName} [${creatorId}]`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const unlockedFeatures = [
    {
      title: "Enemy Sleep Heatmap & Push-Window Radar",
      desc: "Analyze opponent timezones and predict 04:00–08:00 TCT offline sleep windows for uncontested 250-point leads.",
      icon: Moon,
    },
    {
      title: "Ranked War Room & Live Scoreboard",
      desc: "Live hospital countdown timers, chain telemetry, and 1-click direct attack links.",
      icon: Swords,
    },
    {
      title: "Automated Fair-Share War Payout Engine",
      desc: "Algorithmic reward distribution based on hits, Fair-Fight multipliers, clutch bonuses, and 1-click forum BBCode.",
      icon: Calculator,
    },
    {
      title: "War Revive Dispatch Board",
      desc: "Real-time hospital queue with 1-click revive links and automated Xanax payout tracking for contract revivers.",
      icon: HeartPulse,
    },
    {
      title: "Faction Recruitment Radar (Unlimited Scans)",
      desc: "Search active, unaligned players by level and activity with 1-click personalized recruitment invitation letters.",
      icon: Users,
    },
    {
      title: "Armory & Loaner Item Tracker",
      desc: "Track faction-loaned armor, RW weapons, and audit medical/Xanax armory consumption.",
      icon: ShieldAlert,
    },
    {
      title: "Travel Safe-Landing & Stock Radar",
      desc: "5-minute touchdown warning sirens to prevent mugs, plus live overseas plushie, flower, and Xanax stocks.",
      icon: Plane,
    },
    {
      title: "Crimes 2.0 Planner & Vault Banking",
      desc: "Team slot assignment, readiness indicators, and transparent deposit/withdrawal ledgers.",
      icon: ShieldCheck,
    },
    {
      title: "Baldr Leveling & Chain Targets (384 Targets)",
      desc: "Curated low-stat, high-level inactive targets for rapid early leveling and chain building.",
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>OPEN PUBLIC ACCESS • 100% FREE FOR ALL</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          All Tactical Tools Are 100% Free
        </h1>
        <p className="text-zinc-400 text-sm max-w-2xl mx-auto leading-relaxed">
          We&apos;ve paused all paid plans to give every Torn faction and citizen unrestricted access to our combat intelligence, sleep heatmaps, and payout engines. No paywalls, no Xanax required.
        </p>
      </div>

      {/* Main Unlocked Suite Banner */}
      <div className="bg-[#0e0e11] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1c1c1f]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                CURRENT STATUS: UNRESTRICTED
              </span>
              <span className="text-xs font-mono text-zinc-500">Tier: Full Commander</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-2">
              Full Faction Commander Suite (Unlocked for Everyone)
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Every tool and telemetry feed is completely open for your entire roster.
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
              $0 / Free
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
              Zero Xanax • Unlimited Usage
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          {unlockedFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#121215] border border-[#1f1f23] flex items-start gap-3 hover:border-emerald-500/30 transition-colors"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    {feat.title}
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roadmap & Why It's Free */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-[#0e0e11] border border-[#222225] space-y-2.5">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Why is everything free?</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Our mission is to empower developing and competitive factions alike. By making the platform completely free during our public launch, we ensure every commander and rookie has the best possible experience without barrier to entry.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#0e0e11] border border-[#222225] space-y-2.5">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Will paid plans be added later?</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            In the future, we may explore optional faction supporter perks or private hosted Discord bot instances. But the core web tools you see today are built for the community and designed to remain accessible.
          </p>
        </div>
      </div>

      {/* Optional Creator Support / Tip Jar */}
      <div className="bg-[#0b0b0d] border border-[#1e1e22] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-amber-400 font-medium">
              <Heart className="w-3.5 h-3.5 fill-amber-400/20 text-amber-400" />
              <span>Optional Creator Support & Tip Jar</span>
            </div>
            <h3 className="text-sm font-semibold text-white">
              Enjoying the tools? Creator tips are welcome!
            </h3>
            <p className="text-xs text-zinc-400">
              100% voluntary. You never have to pay anything to use the suite. Any Xanax or items sent to{" "}
              <Link
                href={`https://www.torn.com/profiles.php?XID=${creatorId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 font-mono font-medium underline underline-offset-2 transition-colors"
              >
                {creatorName} [{creatorId}]
              </Link>{" "}
              help maintain hosting and development.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyName}
              title="Copy NongGuyver [4552150]"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141417] hover:bg-[#1c1c20] border border-[#27272a] text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>{copied ? "Copied!" : "Copy Recipient"}</span>
            </button>

            <Link
              href={`https://www.torn.com/profiles.php?XID=${creatorId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium text-emerald-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Send in Torn</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

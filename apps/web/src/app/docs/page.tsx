"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Shield,
  Swords,
  Clock,
  Landmark,
  Target,
  Flame,
  Plane,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Info,
  Lock,
  Layers,
  ArrowUpRight,
  Calculator,
  Search,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { playTacticalSound } from "@/lib/sound";
import { ApiTosTable } from "@/components/ApiTosTable";

type DocTab = "MANUAL" | "CHANGELOG";

interface DocSection {
  id: string;
  title: string;
  badge?: string;
  icon: any;
  category: "Combat" | "Operations" | "Economy" | "System";
  summary: string;
  screenshot: string;
  screenshotAlt: string;
  steps: string[];
  tacticalTips: string[];
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: "spies",
    title: "Faction Spy Vault & Fair Fight Solver",
    badge: "v0.3.0 New",
    icon: Shield,
    category: "Combat",
    summary:
      "A centralized high-security intelligence repository for battle stats (Strength, Defense, Speed, Dexterity). Features real-time Supabase cloud synchronization across your faction, age decay tracking, and an automated mathematical Fair Fight reverse-engineering solver.",
    screenshot: "/docs/screenshots/spies.png",
    screenshotAlt: "TornOps Faction Spy Vault and Fair Fight Reverse Engineering Solver interface",
    steps: [
      "Open the Spy Vault from the sidebar navigation (/spies).",
      "To solve an opponent's stats from combat logs: In the Fair Fight Reverse-Engineering Solver widget, enter your known Attacker Battle Stats (TBS) and the Fair Fight modifier from your attack log (e.g. 1.45x). Click 'Solve Opponent Stats'.",
      "To save the solved record: Enter the opponent's Torn ID and click 'Save to Faction Vault'. All teammates will immediately see the updated stats.",
      "To import bulk spy reports: Click 'Bulk Import' at the top right, paste multi-line spy logs or leader tool exports, and click 'Import to Vault'.",
      "Use the search bar and filter dropdowns to instantly filter targets by intel source (Faction Spies, Fair Fight, TornStats), freshness (<14d Fresh, 15-45d Aging, >45d Stale), or stat tier.",
    ],
    tacticalTips: [
      "Fair Fight modifier ranges from 1.00x (opponent is significantly weaker) to 3.00x (opponent has 2.87x or more of your stats). Values between 1.10x and 2.90x yield tight ±0.5% TBS accuracy.",
      "Spies automatically display green (<14 days), amber (15-45 days), or red (>45 days) freshness tags so your faction knows when intel needs re-scouting.",
    ],
  },
  {
    id: "war",
    title: "Ranked War Room & Target Radar",
    badge: "Live Telemetry",
    icon: Swords,
    category: "Combat",
    summary:
      "The command central for active Ranked Wars. Features live score delta projections, hospital exit timers, opponent sleep heatmaps, retal shortcuts, and battle stat radar badges.",
    screenshot: "/docs/screenshots/war.png",
    screenshotAlt: "TornOps Ranked War Room live enemy roster, hospital timers, and sleep heatmap",
    steps: [
      "Navigate to the War Room (/war) during an active or declared Ranked War.",
      "Review the Top Scoreboard: Monitor our faction score, enemy score, lead delta, and target score required for victory.",
      "Analyze the Opponent Sleep Heatmap: The 24-hour UTC bar chart identifies optimal low-activity windows (>60% enemy sleeping) where retaliation risk is minimal.",
      "Filter the Target Roster: Switch between 'Enemy Targets' and 'Friendly Roster'. Use the status filters (All, Ready to Hit, Hospitalized, Traveling) to find vulnerable enemies.",
      "Execute Attacks: Click the red 'Direct Attack' button to launch directly into the Torn combat screen without intermediate profile clicks.",
    ],
    tacticalTips: [
      "Hover over any 'FF-Est' or 'Spied' badge to reveal the target's stat breakdown and days since last intel update.",
      "Sort by 'Stats (Lowest First)' when hunting easy war wins to rapidly build score leads early in the war.",
    ],
  },
  {
    id: "coverage",
    title: "Timezone & Shift Coverage Matrix",
    badge: "Operations",
    icon: Clock,
    category: "Operations",
    summary:
      "24/7 global faction activity visualization. Eliminates vulnerability windows by tracking member presence across UTC and local timezones, highlighting peak shifts and dead zones.",
    screenshot: "/docs/screenshots/coverage.png",
    screenshotAlt: "TornOps Timezone Heatmap and 24-Hour Shift Coverage Matrix interface",
    steps: [
      "Open the Timezones & Shifts page (/coverage).",
      "Inspect the 24-Hour Activity Clock: Shows active, idle, and sleeping members per hour in Torn City Time (TCT / UTC).",
      "Check Shift Coverage Health: Identify 'Dead Zones' (hours with fewer than 3 members awake) and assign night-watch sentries.",
      "Review the Member Roster by Timezone: Organize war squads by regional timezone (Americas, Europe/Africa, Asia/Oceania) to coordinate synchronized pushes.",
    ],
    tacticalTips: [
      "Schedule chain pushes during peak overlap hours when multiple squads are awake simultaneously to ensure chain timers never drop.",
    ],
  },
  {
    id: "banking",
    title: "Faction Vault & Banking Ledger",
    badge: "Operations",
    icon: Landmark,
    category: "Operations",
    summary:
      "Automated personal balance tracking, deposit history, and withdrawal queue for faction members. Prevents accounting errors and duplicate credits using Torn API logs.",
    screenshot: "/docs/screenshots/banking.png",
    screenshotAlt: "TornOps Faction Vault and Banking Ledger interface",
    steps: [
      "Visit Vault & Banking (/banking) to view your current deposited balance.",
      "Depositing Funds: Deposit money into the faction vault directly in Torn. TornOps will automatically scan faction fundsnews and credit your balance.",
      "Requesting Withdrawals: Enter the desired withdrawal amount and click 'Request Withdrawal'. Faction bankers can review and approve requests from their queue.",
      "Audit History: Scroll down to view the chronological log of all deposits, payouts, and withdrawals.",
    ],
    tacticalTips: [
      "Keeping money in the faction vault protects you from hospital muggers and buy-mugs while keeping funds liquid for war equipment and medical supplies.",
    ],
  },
  {
    id: "oc",
    title: "Crimes 2.0 (OC) Team Optimizer",
    badge: "Operations",
    icon: Target,
    category: "Operations",
    summary:
      "Role readiness tracker and slot assignment planner for Crimes 2.0 Organized Crimes. Monitors team readiness, equipment prerequisites, and stalled crimes.",
    screenshot: "/docs/screenshots/oc.png",
    screenshotAlt: "TornOps Crimes 2.0 Organized Crimes slot assignment and readiness dashboard",
    steps: [
      "Navigate to OC 2.0 Optimizer (/oc).",
      "Review Organized Crimes Overview: Inspect all pending, in-progress, and ready-to-initiate crimes.",
      "Check Member Readiness: See which members are hospitalized, traveling abroad, or have insufficient nerve to participate.",
      "Slot Assignments: Drag and assign eligible faction members into crime slots based on recommended success stats and required tools.",
    ],
    tacticalTips: [
      "Always verify that members in high-tier OCs have their passports and required items equipped before the scheduled initiation hour.",
    ],
  },
  {
    id: "payout",
    title: "War Payout Engine",
    badge: "Economy",
    icon: Flame,
    category: "Economy",
    summary:
      "Fair and transparent war pot distribution calculator. Weights compensation by total hits, Fair-Fight bonus modifiers, weapon bonuses, and assists.",
    screenshot: "/docs/screenshots/payout.png",
    screenshotAlt: "TornOps War Payout Calculator with hit-based and Fair-Fight weighted payouts",
    steps: [
      "Open the Payout Engine (/payout).",
      "Input the Total War Pot: Enter the total cash or item proceeds earned from the war.",
      "Select Payout Model: Choose between 'Equal Hit Weight', 'Fair-Fight Weighted', or 'Hybrid Hit + Assist'.",
      "Calculate Payouts: Review the member breakdown showing hits, FF bonus score, share percentage, and total cash earned.",
      "Export Ledger: Copy the payout sheet directly into Torn banking or spreadsheet formats for 1-click fulfillment.",
    ],
    tacticalTips: [
      "Using Fair-Fight weighted payouts incentivizes members to hit difficult targets rather than farming low-level enemies.",
    ],
  },
  {
    id: "targets",
    title: "Baldr's Leveling Targets Directory",
    badge: "Combat",
    icon: Search,
    category: "Combat",
    summary:
      "Curated directory of inactive, high-XP, low-stat Torn players based on Baldr's famous leveling list. Ideal for power-leveling to Level 15 and sustaining faction chain multipliers.",
    screenshot: "/docs/screenshots/targets.png",
    screenshotAlt: "TornOps Baldr Leveling and Chain Targets directory",
    steps: [
      "Navigate to Leveling Targets (/targets).",
      "Filter by Level Range: Set your desired level bracket (e.g. Levels 5-15, 15-30).",
      "Inspect Defense Scores: Verify target defense estimates and weapon effectiveness.",
      "One-Click Attack: Click 'Attack Target' to launch directly into combat.",
    ],
    tacticalTips: [
      "Power-leveling to Level 15 unlocks overseas travel, enabling lucrative plushie and flower trading runs.",
    ],
  },
  {
    id: "travel",
    title: "Foreign Travel & Stock Radar",
    badge: "Economy",
    icon: Plane,
    category: "Economy",
    summary:
      "Real-time overseas stock radar across all 11 flight destinations. Tracks flower and plushie item quantities, depletion rates, and profit-per-minute metrics.",
    screenshot: "/docs/screenshots/travel.png",
    screenshotAlt: "TornOps Foreign Travel stock counts and item price arbitrage radar",
    steps: [
      "Open Travel & Stocks (/travel).",
      "Inspect Country Cards: View live stock quantities for plushies and flowers across Switzerland, Japan, UAE, UK, and all other destinations.",
      "Sort by Profit / Hour: Identify destinations offering the highest net profit per flight hour based on current Torn bazaar market prices.",
      "Departure Cooldown: Time your departures so you arrive immediately before restocks.",
    ],
    tacticalTips: [
      "Upgrade your luggage capacity with an Airstrip and Large Suitcase to carry up to 29 items per trip.",
    ],
  },
];

const RAW_FORUM_HTML = `<div style="max-width: 600px; font-family: Arial, sans-serif; line-height: 1.5; color: #d1d5db;">
  
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="color: #10b981; margin: 0; font-size: 20px;">⚡ TornOps — Master Changelog & Roadmap</h2>
    <p style="font-style: italic; color: #9ca3af; margin: 4px 0 0 0; font-size: 13px;">The Unified Faction Command & Combat Operations Suite</p>
  </div>

  <div style="background-color: #1f2937; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
    <div><strong>Live Platform:</strong> <a href="https://web-ten-dusky-11.vercel.app/" target="_blank" style="color: #38bdf8; text-decoration: underline;">https://web-ten-dusky-11.vercel.app/</a></div>
    <div style="margin-top: 4px;"><strong>Lead Developer:</strong> <a href="https://www.torn.com/profiles.php?XID=4552150" target="_blank" style="color: #38bdf8; text-decoration: underline;">NongGuyver [4552150]</a></div>
    <div style="margin-top: 4px; font-size: 12px; color: #9ca3af;">100% Free Faction Tooling &bull; Zero Subscriptions &bull; Community Driven</div>
  </div>

  <!-- LATEST RELEASE -->
  <div style="margin-bottom: 24px;">
    <h3 style="color: #10b981; border-bottom: 1px solid #374151; padding-bottom: 6px; font-size: 16px; margin: 0 0 10px 0;">🚀 Latest Release: [v0.3.1] — 2026-10-14</h3>
    <div style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;"><strong>Release Name:</strong> Torn City Official API ToS Compliance &amp; Zero-Key Security Hardening</div>

    <div style="margin-bottom: 10px;">
      <strong style="color: #f3f4f6;">API Rules &amp; Player Privacy Compliance:</strong>
      <ul style="margin: 6px 0 0 20px; padding: 0;">
        <li><strong style="color: #e5e7eb;">Mandatory API ToS Disclosure Table:</strong> Implemented the required Torn API Terms of Service table directly at all key entry points (Connect Modal, Settings page, and /docs).</li>
        <li><strong style="color: #e5e7eb;">Zero Key / Partial Key Display:</strong> Completely eliminated all display of keys, masked keys, or obfuscated keys anywhere on the platform. Key pooling interfaces have been removed.</li>
        <li><strong style="color: #e5e7eb;">Strict Client-Side Storage:</strong> All Public API keys are stored exclusively in the player's local browser (<code style="color: #93c5fd;">localStorage</code>) and are never stored on any central server database.</li>
        <li><strong style="color: #e5e7eb;">Explicit ToS Consent:</strong> Added mandatory user acknowledgement checkbox prior to key connection.</li>
        <li><strong style="color: #e5e7eb;">Instant Key Erasure:</strong> 1-click Disconnect immediately wipes credentials and cache from local browser storage.</li>
      </ul>
    </div>
  </div>

  <!-- HISTORICAL RELEASES -->
  <div style="margin-bottom: 24px;">
    <h4 style="color: #fbbf24; margin: 0 0 6px 0; font-size: 14px;">[v0.3.0] — 2026-10-14 (Faction Spy Vault &amp; Fair Fight Solver)</h4>
    <ul style="margin: 0 0 0 20px; padding: 0;">
      <li><strong style="color: #e5e7eb;">Faction Spy Vault:</strong> Centralized battle stat repository with teammate auto-sync, search by name/ID, and freshness decay indicators.</li>
      <li><strong style="color: #e5e7eb;">Fair Fight (FF) Reverse Solver:</strong> Precise mathematical engine that computes defender Total Battle Stats from attack log modifiers.</li>
      <li><strong style="color: #e5e7eb;">Bulk Clipboard Importer:</strong> One-click parser supporting multi-line spy logs with automatic ID recognition.</li>
      <li><strong style="color: #e5e7eb;">War Room Radar Integration:</strong> Combat estimate badges and radar tooltips injected directly into the live enemy war roster.</li>
    </ul>
  </div>

  <hr style="border: 0; border-top: 1px solid #374151; margin: 20px 0;" />

  <!-- UPCOMING ROADMAP -->
  <div style="margin-bottom: 24px;">
    <h3 style="color: #3b82f6; border-bottom: 1px solid #374151; padding-bottom: 6px; font-size: 16px; margin: 0 0 10px 0;">🔮 Upcoming Roadmap & In Progress</h3>
    
    <div style="margin-bottom: 10px;">
      <strong style="color: #93c5fd;">Phase 2: Discord Bot Integration:</strong>
      <ul style="margin: 6px 0 0 20px; padding: 0;">
        <li><strong style="color: #e5e7eb;">Slash Commands:</strong> <code style="color: #93c5fd;">/payout</code> (live war earnings), <code style="color: #93c5fd;">/revive</code> (emergency contract dispatch), <code style="color: #93c5fd;">/balance &amp; /withdraw</code> (vault access), <code style="color: #93c5fd;">/targets</code> (leveling search).</li>
        <li><strong style="color: #e5e7eb;">Automated Watchdogs:</strong> Urgent chain drop alert (&lt;60s ping), hospital exit tracker for priority targets, armory low-stock alerts, and Crimes 2.0 inactivity nudges.</li>
      </ul>
    </div>

    <div style="margin-bottom: 10px;">
      <strong style="color: #93c5fd;">Phase 3: Trading &amp; Flip Ledger Suite:</strong>
      <ul style="margin: 6px 0 0 20px; padding: 0;">
        <li><strong style="color: #e5e7eb;">Dynamic Pricing Engine:</strong> Configurable buy rates pegged to live market rates with public trader price sheet.</li>
        <li><strong style="color: #e5e7eb;">Multi-Channel Profit Ledger:</strong> All-in-one net profit accounting across Bazaars, Item Market, P2P trades, Auction House, mugging discounts, cache/pack openings, Big Al's Bunker, and UID weapon/armor flips.</li>
        <li><strong style="color: #e5e7eb;">One-Click Trade Receipts:</strong> Clean forum receipts generated automatically for trade chats and direct deposit into the member's vault balance.</li>
      </ul>
    </div>

    <div style="margin-bottom: 10px;">
      <strong style="color: #93c5fd;">Phase 4: Browser Extension &amp; War Companion HUD:</strong>
      <ul style="margin: 6px 0 0 20px; padding: 0;">
        <li><strong style="color: #e5e7eb;">Free Ranked War Companion:</strong> In-game live enemy roster with hospital recovery timers, chain alerts, 1-click retal links, battle stat estimates, and PC wide mode (100% free native overlay).</li>
        <li><strong style="color: #e5e7eb;">In-Game HUD Overlays:</strong> Floating energy, nerve, happy, life, and travel cooldown timers with 1-click Quick Medical and Quick Xanax.</li>
        <li><strong style="color: #e5e7eb;">DOM Profile Badges:</strong> Injects TornOps estimated battle stats, hospital timers, and vault balances right into torn.com pages.</li>
      </ul>
    </div>

    <div>
      <strong style="color: #93c5fd;">Phase 5: Company Marketplace &amp; Recruitment Radar:</strong>
      <ul style="margin: 6px 0 0 20px; padding: 0;">
        <li><strong style="color: #e5e7eb;">Job Centre Marketplace:</strong> Two-sided recruitment hub connecting players and company directors by work stats (MAN/INT/END), activity, and desired wages.</li>
        <li><strong style="color: #e5e7eb;">Hall of Fame Talent Scanner:</strong> Automated public API candidate finder targeting active, unemployed players and factionless recruits with ready-to-send outreach templates.</li>
        <li><strong style="color: #e5e7eb;">Company Valuation &amp; Directory:</strong> Comprehensive director toolkit with company rating calculators, star perk comparisons, and income analytics.</li>
      </ul>
    </div>
  </div>

  <hr style="border: 0; border-top: 1px solid #374151; margin: 20px 0;" />

  <!-- HISTORICAL RELEASES -->
  <div>
    <h3 style="color: #f59e0b; border-bottom: 1px solid #374151; padding-bottom: 6px; font-size: 16px; margin: 0 0 10px 0;">📦 Historical Releases</h3>

    <div style="margin-bottom: 16px;">
      <h4 style="color: #fbbf24; margin: 0 0 6px 0; font-size: 14px;">[v0.2.0] — 2026-10-12 (Ranked War Intelligence Hub & Cloud Sync)</h4>
      <ul style="margin: 0 0 0 20px; padding: 0;">
        <li><strong style="color: #e5e7eb;">Ranked War Intelligence Hub:</strong> Live war scoreboard, score delta projection, target difficulty ranking, and hospital exit watcher.</li>
        <li><strong style="color: #e5e7eb;">Combat Modifier Detection Banner:</strong> Added status verification banner and precision matching on combat logs.</li>
        <li><strong style="color: #e5e7eb;">Leader Clipboard Importer:</strong> Roster parser supporting one-click clipboard exports from external rosters with automatic ID/role mapping.</li>
        <li><strong style="color: #e5e7eb;">Cloud Database Sync:</strong> Real-time Supabase cloud sync allowing instantaneous spy and target sharing across all teammates.</li>
        <li><strong style="color: #e5e7eb;">Sanitized Live Telemetry:</strong> Strict production mode that completely eliminates fallback mock records for authenticated members.</li>
      </ul>
    </div>

    <div>
      <h4 style="color: #fbbf24; margin: 0 0 6px 0; font-size: 14px;">[v0.1.0] — 2026-10-09 (Initial Foundation)</h4>
      <ul style="margin: 0 0 0 20px; padding: 0;">
        <li><strong style="color: #e5e7eb;">Faction Vault & Banking:</strong> Deposit and withdrawal ledger, automated fundsnews log poller to eliminate duplicate credits, and banker fulfillment queue.</li>
        <li><strong style="color: #e5e7eb;">Timezone Heatmap & Coverage:</strong> 24/7 global faction activity visualization and shift coverage matrix to avoid undefended war windows.</li>
        <li><strong style="color: #e5e7eb;">Crimes 2.0 (OC) Base:</strong> Role assignment planner for planned crimes, team readiness tracking, and stalled crime detector.</li>
        <li><strong style="color: #e5e7eb;">War Payout Calculator:</strong> Hit-based and difficulty-weighted payout engine with weapon bonuses and assist point adjustments.</li>
        <li><strong style="color: #e5e7eb;">Baldr's Target Directory:</strong> Curated leveling and chain target directory with 1-click attack shortcuts.</li>
      </ul>
    </div>
  </div>

</div>`;

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<DocTab>("MANUAL");
  const [copiedForumHtml, setCopiedForumHtml] = useState(false);
  const [activeNav, setActiveNav] = useState("spies");
  const [showRawHtml, setShowRawHtml] = useState(false);

  const handleCopyForumHtml = async () => {
    try {
      await navigator.clipboard.writeText(RAW_FORUM_HTML);
      setCopiedForumHtml(true);
      playTacticalSound("chime");
      setTimeout(() => setCopiedForumHtml(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Operational Handbook & Intelligence Library
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            TornOps Documentation
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              v0.3.0 Live
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Complete guide to faction combat, banking, intelligence reverse-engineering, and strategic operations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("MANUAL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "MANUAL"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-900/30"
                : "text-slate-400 hover:text-white"
            }`}
            aria-label="View User Manual & Guides"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>User Manual</span>
          </button>
          <button
            onClick={() => setActiveTab("CHANGELOG")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "CHANGELOG"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-900/30"
                : "text-slate-400 hover:text-white"
            }`}
            aria-label="View Master Changelog & Roadmap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Changelog & Roadmap</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USER MANUAL */}
      {activeTab === "MANUAL" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sticky Quick-Nav Sidebar */}
          <aside className="lg:col-span-1 bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-1 lg:sticky lg:top-20 z-10">
            <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 mb-2">
              Module Quick Jump
            </div>
            {/* Quick Jump: API Compliance & ToS */}
            <a
              href="#compliance"
              onClick={() => setActiveNav("compliance")}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                activeNav === "compliance"
                  ? "bg-slate-800 text-white font-bold border border-slate-700"
                  : "text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">API Compliance &amp; ToS</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 shrink-0">
                Mandate
              </span>
            </a>
            {DOC_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeNav === sec.id;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveNav(sec.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-slate-800 text-white font-bold border border-slate-700"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span className="truncate">{sec.title}</span>
                  </div>
                  {sec.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 shrink-0">
                      {sec.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </aside>

          {/* Main Documentation Content Area */}
          <main className="lg:col-span-3 space-y-12">
            {/* Torn API Terms of Service & Security Compliance Section */}
            <section
              id="compliance"
              className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 sm:p-7 space-y-6 scroll-mt-24 shadow-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Policy &amp; Rules</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        Official Mandate
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Torn City API Compliance &amp; Terms of Service (ToS)
                    </h2>
                  </div>
                </div>

                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition self-start sm:self-auto"
                >
                  <span>API Settings</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                </Link>
              </div>

              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
                <p>
                  TornOps is engineered from the ground up to strictly comply with all Torn City third-party developer rules and API guidelines. We maintain a zero-compromise security posture regarding player credentials and privacy.
                </p>
                <p className="text-slate-400 text-xs">
                  Review the official disclosure table below for exact specifications regarding key access requirements, client-side storage, and our zero-sharing policy.
                </p>
              </div>

              {/* Render Full API ToS Table */}
              <ApiTosTable />
            </section>
            {DOC_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-6 scroll-mt-24 shadow-xl transition-all"
                >
                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase text-slate-400">{sec.category}</span>
                          {sec.badge && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                              {sec.badge}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{sec.title}</h2>
                      </div>
                    </div>

                    <Link
                      href={`/${sec.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition self-start sm:self-auto"
                      aria-label={`Open Tool: ${sec.title}`}
                    >
                      <span>Open Tool</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                    </Link>
                  </div>

                  {/* Summary */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{sec.summary}</p>

                  {/* Visual Screenshot Frame */}
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl relative group">
                    <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                        <span className="ml-2 text-slate-300 font-medium">/{sec.id} preview</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">High-Fidelity Telemetry</span>
                    </div>

                    <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                      <Image
                        src={sec.screenshot}
                        alt={sec.screenshotAlt}
                        fill
                        className="object-cover object-top transition duration-300 group-hover:scale-[1.01]"
                        sizes="(max-width: 1024px) 100vw, 75vw"
                        priority={sec.id === "spies"}
                      />
                    </div>
                  </div>

                  {/* Step-by-Step Instructions */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Operational Instructions:</span>
                    </h3>
                    <ol className="space-y-2.5">
                      {sec.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-bold text-[10px] shrink-0 border border-cyan-500/20 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Tactical Pro Tips */}
                  <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-900/30 space-y-1.5">
                    <div className="text-[11px] font-bold text-cyan-300 font-mono flex items-center gap-1.5 uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Tactical Notes & Pro Tips:</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                      {sec.tacticalTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              );
            })}
          </main>
        </div>
      )}

      {/* TAB 2: MASTER CHANGELOG */}
      {activeTab === "CHANGELOG" && (
        <div className="space-y-6">
          {/* Forum Copy Action Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-emerald-900/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileText className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-white">Torn Forum Rich-Text Compatible HTML</h3>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Ready to update the Torn forum thread? Click below to copy containerized HTML styled specifically for Torn's TinyMCE editor (Tools &gt; Source code).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowRawHtml(!showRawHtml)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
                aria-label="Toggle raw HTML source preview"
              >
                {showRawHtml ? "Hide Code" : "View Raw Code"}
              </button>
              <button
                onClick={handleCopyForumHtml}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-900/40"
                aria-label="Copy Torn Forum HTML code"
              >
                {copiedForumHtml ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Forum HTML</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showRawHtml && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <label htmlFor="raw-forum-code" className="font-mono text-[11px] font-bold text-slate-300">
                  Raw HTML Source (Tools &gt; Source Code &lt; &gt;):
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Select all &amp; copy</span>
              </div>
              <textarea
                id="raw-forum-code"
                name="rawForumCode"
                readOnly
                rows={10}
                value={RAW_FORUM_HTML}
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono text-cyan-300 focus:outline-none"
              />
            </div>
          )}

          {/* Interactive Release Cards */}
          <div className="space-y-6">
            {/* [v0.3.0] */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      v0.3.0
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Released 2026-10-14</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    Faction Spy Vault, Fair Fight Reverse Engine & Accessibility 100/100
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold hidden sm:inline">Latest Release</span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white">Combat Intelligence:</div>
                <ul className="space-y-1.5 pl-4 list-disc text-slate-400">
                  <li>
                    <strong className="text-slate-200">Fair Fight Reverse Solver:</strong> Precise mathematical engine that calculates defender Total Battle Stats from attack log Fair Fight multipliers. Includes multi-hit Bayesian intersection.
                  </li>
                  <li>
                    <strong className="text-slate-200">Faction Spy Vault (/spies):</strong> Centralized battle stat repository with teammate cloud sync, search by ID/name, and freshness decay indicators.
                  </li>
                  <li>
                    <strong className="text-slate-200">Bulk Clipboard Importer:</strong> Parse multi-line exports from leader spreadsheets, bots, and Discord logs.
                  </li>
                  <li>
                    <strong className="text-slate-200">War Room Radar Badges:</strong> Tactical radar icons and tooltip stat breakdowns injected into the live enemy war roster.
                  </li>
                  <li>
                    <strong className="text-slate-200">100/100 Lighthouse UI Quality:</strong> Full WCAG AA color contrast, complete keyboard accessibility, and zero lag.
                  </li>
                </ul>
              </div>
            </div>

            {/* [v0.2.0] */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      v0.2.0
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Released 2026-10-12</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    Ranked War Intelligence Hub & Cloud Sync
                  </h3>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <ul className="space-y-1.5 pl-4 list-disc text-slate-400">
                  <li>
                    <strong className="text-slate-200">Ranked War Intelligence Hub:</strong> Live war scoreboard, score delta projection, target difficulty ranking, and hospital exit watcher.
                  </li>
                  <li>
                    <strong className="text-slate-200">Combat Modifier Detection Banner:</strong> Status verification banner and precision matching on combat logs.
                  </li>
                  <li>
                    <strong className="text-slate-200">Leader Clipboard Importer:</strong> Roster parser supporting one-click clipboard exports from external rosters.
                  </li>
                  <li>
                    <strong className="text-slate-200">Cloud Database Sync:</strong> Real-time Supabase cloud sync allowing instantaneous spy and target sharing across teammates.
                  </li>
                </ul>
              </div>
            </div>

            {/* [v0.1.0] */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      v0.1.0
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Initial Foundation</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    Faction Vault & Banking, Heatmap & Crimes 2.0 Base
                  </h3>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <ul className="space-y-1.5 pl-4 list-disc text-slate-400">
                  <li>
                    <strong className="text-slate-200">Faction Vault & Banking:</strong> Deposit and withdrawal ledger with fundsnews verification.
                  </li>
                  <li>
                    <strong className="text-slate-200">Timezone Heatmap & Coverage:</strong> 24/7 global faction activity visualization and shift coverage matrix.
                  </li>
                  <li>
                    <strong className="text-slate-200">Crimes 2.0 (OC) Base:</strong> Role assignment planner and team readiness tracking.
                  </li>
                  <li>
                    <strong className="text-slate-200">War Payout Calculator:</strong> Hit-based and difficulty-weighted payout engine.
                  </li>
                  <li>
                    <strong className="text-slate-200">Baldr's Target Directory:</strong> Curated leveling and chain target directory.
                  </li>
                </ul>
              </div>
            </div>

            {/* Upcoming Roadmap Phases */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-blue-900/30 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Upcoming Development Roadmap (Phases 2-5)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-blue-300 font-bold font-mono">Phase 2: Discord Bot Integration</span>
                  <p>Slash commands (/payout, /revive, /balance) and automated urgent chain drop & hospital exit watchdogs.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-blue-300 font-bold font-mono">Phase 3: Trading & Flip Ledger Suite</span>
                  <p>Multi-channel net profit ledger (Market, Bazaar, P2P trades, Auction House, mugging discounts, UID weapon/armor flips).</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-blue-300 font-bold font-mono">Phase 4: Browser Extension & War HUD</span>
                  <p>100% Free Ranked War Companion HUD: live enemy hospital timers, chain alerts, retal links, and PC wide mode.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-blue-300 font-bold font-mono">Phase 5: JobCentre+ & Talent Radar</span>
                  <p>Two-sided company recruitment marketplace and Hall of Fame API scanner for active unemployed players.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

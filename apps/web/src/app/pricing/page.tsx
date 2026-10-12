"use client";

import { useState } from "react";
import {
  Tag,
  Check,
  Zap,
  Star,
  Diamond,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Clock,
  ArrowRight,
  Users,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  price: string;
  unit: string;
  subPrice?: string;
  highlight?: boolean;
  icon: any;
  iconColor: string;
  description: string;
  features: string[];
}

const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Recruit",
    badge: "NO PAYMENT REQUIRED",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    price: "Free",
    unit: "forever",
    description: "Essential tactical tools for every Torn citizen and developing faction.",
    icon: Tag,
    iconColor: "text-zinc-400",
    features: [
      "1 recruitment scan per day (up to 5 results)",
      "Ranked War live scoreboard (30s polling)",
      "Standard OC 2.0 slot viewer",
      "384 curated leveling & chain targets",
      "Travel flight countdowns & overseas stock checker",
      "Vault banking manual balance book",
      "Client-side zero-knowledge API security",
    ],
  },
  {
    id: "war-pass",
    name: "War Pass",
    badge: "PAY PER WAR",
    badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    price: "2",
    unit: "Xanax",
    subPrice: "~$1.7M Torn Cash • 7 Days",
    description: "Designed for factions entering an active Ranked War cycle this week.",
    icon: Zap,
    iconColor: "text-amber-400",
    features: [
      "7 days full combat suite access",
      "1-second hospital countdown snipe timers",
      "Automated War Payout Engine (Fair-Fight multipliers)",
      "1-click Torn forum BBCode payout summary",
      "Revive Dispatch queue with 1-click revive links",
      "5 recruitment scans (up to 20 results each)",
      "Priority 10s war room telemetry polling",
      "Export war results to CSV",
    ],
  },
  {
    id: "commander",
    name: "Commander",
    badge: "MOST POPULAR",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    price: "10",
    unit: "Xanax / mo",
    subPrice: "~$8.4M Torn Cash • 30 Days",
    highlight: true,
    icon: Star,
    iconColor: "text-purple-400",
    description: "Complete faction command suite for warring factions and ambitious leadership.",
    features: [
      "30 days full access for your ENTIRE faction",
      "Enemy Sleep Schedule 24h Heatmap & Push-Window Predictor",
      "Automated War Payouts with custom bonus pots & fair-fight math",
      "1-click pre-filled Torn Vault transfer links",
      "Vault & Banking auto-ingester for Torn fundsnews",
      "OC 2.0 auto-nudge queue with 1-click Discord ping generator",
      "Armory & Loaner equipment tracking with medical usage audits",
      "Revive Dispatch ledger with automatic reviver payout tallies",
      "Audible chain panic sirens (60s / 30s alarms)",
      "Unlimited recruitment radar scans & CSV export",
      "Priority 5s real-time war room polling",
    ],
  },
  {
    id: "syndicate",
    name: "Syndicate Lifetime",
    badge: "VIP FOUNDER",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    price: "50",
    unit: "Xanax",
    subPrice: "~$42M Torn Cash • Permanent",
    icon: Diamond,
    iconColor: "text-blue-400",
    description: "Permanent VIP license for veteran factions, hall of fame crews, and leaders.",
    features: [
      "Lifetime access for your faction (never pay again)",
      "Every current and future tactical tool included",
      "Multi-leader & banker role-based permissions",
      "Dedicated Discord bot instance & custom webhook routing",
      "Custom faction accent colors and branding",
      "VIP Founder badge displayed across global telemetry",
      "Unlimited candidate scans & export capacity",
      "Direct priority feature requests & support",
    ],
  },
];

export default function PricingPage() {
  const { userProfile, isLive } = useTorn();
  const [selectedPlan, setSelectedPlan] = useState<string>("commander");
  const [copied, setCopied] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  // Recipient details for Xanax payment
  const recipientName = "Mildly Dangerous";
  const recipientId = 57693;

  const handleCopyName = () => {
    navigator.clipboard.writeText(`${recipientName} [${recipientId}]`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    setIsVerifying(true);
    setVerifyMessage(null);

    setTimeout(() => {
      setIsVerifying(false);
      setVerifyMessage(
        "Scanning Torn API events for recent incoming transfers... If you just sent the Xanax, allow 30-60 seconds for Torn's API cache to update."
      );
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>IN-GAME XANAX SUBSCRIPTION</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Tactical Operations Plans
        </h1>
        <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
          Free citizen tools forever. Upgrade to high-speed Ranked War telemetry, automated payout engines, and sleep heatmaps. Pay in Xanax directly in-game.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const Icon = plan.icon;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative flex flex-col justify-between rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                plan.highlight
                  ? "bg-[#0f0e14] border-2 border-purple-500/60 shadow-xl shadow-purple-950/20"
                  : isSelected
                  ? "bg-[#111114] border border-blue-500/60"
                  : "bg-[#0d0d0f] border border-[#222225] hover:border-[#333338]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full tracking-wider uppercase shadow-md">
                  Commander Choice
                </div>
              )}

              <div>
                {/* Header & Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-[#18181c] border border-[#27272a] ${plan.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {plan.badge && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>
                  )}
                </div>

                {/* Plan Title & Price */}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <div className="mt-2 mb-1 flex items-baseline gap-1.5">
                  <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-mono">
                    {plan.price}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">{plan.unit}</span>
                </div>
                {plan.subPrice && (
                  <p className="text-[11px] font-mono text-zinc-400 mb-3">{plan.subPrice}</p>
                )}
                <p className="text-xs text-zinc-400 leading-relaxed mt-2 mb-4">{plan.description}</p>

                {/* Features Divider */}
                <div className="border-t border-[#1f1f23] my-4" />

                {/* Feature Bullet Points */}
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Select Button */}
              <button
                type="button"
                className={`mt-6 w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  plan.highlight
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30"
                    : isSelected
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-[#18181b] hover:bg-[#222226] text-zinc-300 border border-[#27272a]"
                }`}
              >
                {plan.id === "free" ? "Included Free" : isSelected ? "Selected Plan" : "Choose Plan"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Torn In-Game Payment Bar (TornCrew-style) */}
      <div className="bg-[#0e0e11] border border-[#27272c] rounded-xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                In-Game Transfer Destination
              </span>
            </div>
            <div className="text-lg font-bold text-white flex items-center justify-center lg:justify-start gap-2">
              <span>Send Xanax to:</span>
              <span className="text-purple-300 font-mono underline decoration-purple-500/50">
                {recipientName} [{recipientId}]
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              No message or note required. Just send the exact item quantity. Access activates automatically within 30 seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleCopyName}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#18181c] border border-[#2c2c32] hover:border-zinc-500 text-xs font-semibold text-zinc-200 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>{copied ? "Copied to Clipboard!" : "Copy Name"}</span>
            </button>

            <a
              href="https://www.torn.com/item.php#Xanax"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Inventory (Torn)</span>
            </a>

            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
              <span>{isVerifying ? "Checking Logs..." : "I've Paid, Verify Now"}</span>
            </button>
          </div>
        </div>

        {verifyMessage && (
          <div className="mt-4 p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2 font-mono">
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{verifyMessage}</span>
          </div>
        )}
      </div>

      {/* FAQ / Guarantees Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225] space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero-Knowledge Security</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your Public API key never leaves your browser. It is saved in your local storage and sent only to Torn&apos;s official API endpoints.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225] space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Instant Auto-Activation</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Torn API event logs verify the sender&apos;s Torn ID and item quantity automatically. No secret codes or manual confirmations needed.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225] space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Entire Faction Coverage</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Commander and Syndicate tiers cover your whole faction. When the leader or banker upgrades, every member gets high-speed war room access.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTorn } from "@/context/TornContext";
import { playTacticalSound } from "@/lib/sound";
import {
  Plane,
  Clock,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Package,
  Search,
  ExternalLink,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Info,
  Radio,
} from "lucide-react";

interface OverseasDestination {
  id: string;
  country: string;
  flag: string;
  flightMinutesStandard: number; // e.g. 177 mins
  flightMinutesAirstrip: number; // e.g. 124 mins
  featuredItem: string;
  itemType: "Plushie" | "Flower" | "Drug" | "Special";
  localCost: number;
  tornMarketValue: number;
  stockCount: number;
  lastUpdated: string;
}

const DESTINATIONS: OverseasDestination[] = [
  {
    id: "uae",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    flightMinutesStandard: 247,
    flightMinutesAirstrip: 173,
    featuredItem: "Camel Plushie",
    itemType: "Plushie",
    localCost: 14000,
    tornMarketValue: 98500,
    stockCount: 480,
    lastUpdated: "3m ago",
  },
  {
    id: "switzerland",
    country: "Switzerland",
    flag: "🇨🇭",
    flightMinutesStandard: 177,
    flightMinutesAirstrip: 124,
    featuredItem: "Chamois Plushie",
    itemType: "Plushie",
    localCost: 400,
    tornMarketValue: 47200,
    stockCount: 1120,
    lastUpdated: "1m ago",
  },
  {
    id: "south_africa",
    country: "South Africa",
    flag: "🇿🇦",
    flightMinutesStandard: 298,
    flightMinutesAirstrip: 209,
    featuredItem: "Xanax",
    itemType: "Drug",
    localCost: 835000,
    tornMarketValue: 841000,
    stockCount: 142,
    lastUpdated: "2m ago",
  },
  {
    id: "south_africa_lion",
    country: "South Africa",
    flag: "🇿🇦",
    flightMinutesStandard: 298,
    flightMinutesAirstrip: 209,
    featuredItem: "Lion Plushie",
    itemType: "Plushie",
    localCost: 400,
    tornMarketValue: 69800,
    stockCount: 650,
    lastUpdated: "2m ago",
  },
  {
    id: "uk",
    country: "United Kingdom",
    flag: "🇬🇧",
    flightMinutesStandard: 159,
    flightMinutesAirstrip: 111,
    featuredItem: "Red Fox Plushie",
    itemType: "Plushie",
    localCost: 1000,
    tornMarketValue: 45000,
    stockCount: 890,
    lastUpdated: "4m ago",
  },
  {
    id: "japan",
    country: "Japan",
    flag: "🇯🇵",
    flightMinutesStandard: 227,
    flightMinutesAirstrip: 159,
    featuredItem: "Cherry Blossom",
    itemType: "Flower",
    localCost: 500,
    tornMarketValue: 56500,
    stockCount: 1430,
    lastUpdated: "6m ago",
  },
  {
    id: "argentina",
    country: "Argentina",
    flag: "🇦🇷",
    flightMinutesStandard: 167,
    flightMinutesAirstrip: 117,
    featuredItem: "Monkey Plushie",
    itemType: "Plushie",
    localCost: 400,
    tornMarketValue: 47000,
    stockCount: 780,
    lastUpdated: "2m ago",
  },
  {
    id: "hawaii",
    country: "Hawaii",
    flag: "🇺🇸",
    flightMinutesStandard: 134,
    flightMinutesAirstrip: 94,
    featuredItem: "Orchid",
    itemType: "Flower",
    localCost: 700,
    tornMarketValue: 33500,
    stockCount: 2200,
    lastUpdated: "8m ago",
  },
  {
    id: "cayman",
    country: "Cayman Islands",
    flag: "🇰🇾",
    flightMinutesStandard: 35,
    flightMinutesAirstrip: 25,
    featuredItem: "Banana Orchid",
    itemType: "Flower",
    localCost: 400,
    tornMarketValue: 10500,
    stockCount: 3100,
    lastUpdated: "1m ago",
  },
  {
    id: "mexico",
    country: "Mexico",
    flag: "🇲🇽",
    flightMinutesStandard: 26,
    flightMinutesAirstrip: 18,
    featuredItem: "Jaguar Plushie",
    itemType: "Plushie",
    localCost: 10000,
    tornMarketValue: 18500,
    stockCount: 1800,
    lastUpdated: "5m ago",
  },
  {
    id: "canada",
    country: "Canada",
    flag: "🇨🇦",
    flightMinutesStandard: 41,
    flightMinutesAirstrip: 29,
    featuredItem: "Wolverine Plushie",
    itemType: "Plushie",
    localCost: 30,
    tornMarketValue: 9800,
    stockCount: 2400,
    lastUpdated: "7m ago",
  },
];

export default function TravelPage() {
  const { userProfile, isLive } = useTorn();
  const [carryCapacity, setCarryCapacity] = useState(29); // 5 base + 10 suitcase + 10 faction perk + 4 WLT
  const [hasAirstrip, setHasAirstrip] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [soundAlerts, setSoundAlerts] = useState(true);

  // Check if live player is traveling or abroad
  const isPlayerTraveling =
    userProfile?.status?.state === "Traveling" || userProfile?.status?.state === "Abroad";

  // Active Flight Timer simulation or live sync
  const [isSimulatingFlight, setIsSimulatingFlight] = useState(!isLive);
  const [flightDestination, setFlightDestination] = useState(!isLive ? "Switzerland" : "Torn City");
  const [flightSecondsLeft, setFlightSecondsLeft] = useState(!isLive ? 482 : 0);
  const hasWarnedRef = useRef(false);

  // Auto-sync with live Torn telemetry if traveling
  useEffect(() => {
    if (isLive) {
      if (isPlayerTraveling && userProfile?.status?.until) {
        const remaining = Math.max(0, userProfile.status.until - Math.floor(Date.now() / 1000));
        setFlightSecondsLeft(remaining);
        setFlightDestination(
          userProfile.status.description.replace(/^Traveling to /i, "").replace(/^In /i, "") || "Overseas"
        );
        setIsSimulatingFlight(false);
      } else {
        setFlightSecondsLeft(0);
        setFlightDestination(userProfile?.status?.description || "Torn City");
        setIsSimulatingFlight(false);
      }
    } else {
      setIsSimulatingFlight(true);
      setFlightDestination("Switzerland");
      setFlightSecondsLeft(482);
    }
  }, [isLive, isPlayerTraveling, userProfile?.status?.until, userProfile?.status?.description]);

  // Decrement seconds
  useEffect(() => {
    if (flightSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setFlightSecondsLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next <= 300 && next > 0 && !hasWarnedRef.current && soundAlerts) {
          playTacticalSound("warning");
          hasWarnedRef.current = true;
        }
        if (next > 300) {
          hasWarnedRef.current = false;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [flightSecondsLeft, soundAlerts]);

  const testAlarm = () => {
    playTacticalSound("warning");
  };

  const minutesLeft = Math.floor(flightSecondsLeft / 60);
  const secondsRemainder = flightSecondsLeft % 60;
  const isMugDanger = flightSecondsLeft <= 300 && flightSecondsLeft > 0; // Under 5 minutes = danger window

  const filteredDestinations = DESTINATIONS.filter((d) => {
    const matchesFilter = filterType === "ALL" || d.itemType.toUpperCase() === filterType;
    const matchesSearch =
      d.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.featuredItem.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222225] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-950/40 border border-sky-500/30 text-sky-400">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Travel Safe-Landing & Stock Tracker
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  100% FREE CITIZEN TOOL
                </span>
                {isPlayerTraveling ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Radio className="w-3 h-3 mr-1 animate-pulse" /> LIVE TELEMETRY
                  </span>
                ) : isLive ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    GROUNDED IN TORN
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#141416] text-[#71717a] border border-[#222225]">
                    SIMULATION MODE
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Mug-defense countdown timers, live plushie & flower stock, and profit-per-minute calculations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={testAlarm}
            title="Preview Mug Audio Alert"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#27272a] bg-[#141416] text-[#a1a1aa] hover:text-white hover:border-amber-500/40 transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Test Alarm
          </button>

          <button
            onClick={() => setSoundAlerts(!soundAlerts)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              soundAlerts
                ? "bg-[#141416] border-[#27272a] text-white hover:border-[#3f3f46]"
                : "bg-[#0d0d0f] border-[#222225] text-[#71717a]"
            }`}
          >
            {soundAlerts ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Mug Alarm Active
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                Mug Alarm Muted
              </>
            )}
          </button>

          <Link
            href="https://www.torn.com/travelagency.php"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-sky-950/40"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Travel Agency
          </Link>
        </div>
      </div>

      {/* Flight Safe-Landing Radar Box */}
      {flightSecondsLeft > 0 ? (
        <div
          className={`p-5 rounded-xl border transition-all ${
            isMugDanger
              ? "bg-amber-950/20 border-amber-500/40 shadow-xl shadow-amber-950/30"
              : "bg-[#0d0d0f] border-[#222225]"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl border ${
                  isMugDanger
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse"
                    : "bg-sky-500/10 border-sky-500/20 text-sky-400"
                }`}
              >
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    Active In-Flight Radar: En Route to {flightDestination}
                  </span>
                  {isMugDanger ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      TOUCHDOWN IMMINENT (PREPARE MUG DEFENSE)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      SAFE TRANSIT
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#a1a1aa] mt-1">
                  Hospitalizers and mug bots wait for players touching down with raw cash. Have your buy screen ready.
                </p>
              </div>
            </div>

            {/* Countdown & Quick Action */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[11px] text-[#71717a]">Estimated Touchdown</div>
                <div
                  className={`text-2xl font-mono font-bold tracking-tight ${
                    isMugDanger ? "text-amber-400" : "text-white"
                  }`}
                >
                  {minutesLeft}m {secondsRemainder < 10 ? `0${secondsRemainder}` : secondsRemainder}s
                </div>
              </div>

              <Link
                href="https://www.torn.com/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1a1a1e] hover:bg-[#25252a] text-white border border-[#333338] flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                1-Click Torn Tab
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-xl border bg-[#0d0d0f] border-[#222225]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    Flight Radar Standby: Grounded in Torn City
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    READY FOR DEPARTURE
                  </span>
                </div>
                <p className="text-xs text-[#a1a1aa] mt-1">
                  You are currently in Torn City. Safe-landing countdown telemetry arms automatically once your flight boards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsSimulatingFlight(true);
                  setFlightSecondsLeft(480);
                  setFlightDestination("Switzerland");
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#27272a] bg-[#141416] text-[#a1a1aa] hover:text-white transition-colors"
              >
                Test Flight Alarm
              </button>
              <Link
                href="https://www.torn.com/travelagency.php"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-sky-950/40"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Travel Agency
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Flight Parameters & Capacity Bar */}
      <div className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#a1a1aa]">Your Carry Capacity:</span>
            <span className="font-mono font-bold text-white bg-[#141416] px-2.5 py-1 rounded border border-[#27272a]">
              {carryCapacity} items
            </span>
            <span className="text-[11px] text-[#71717a]">(Suitcase + Faction Excursion)</span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="hasAirstrip" className="text-[#a1a1aa] flex items-center gap-1 cursor-pointer">
              <input
                id="hasAirstrip"
                name="hasAirstrip"
                type="checkbox"
                checked={hasAirstrip}
                onChange={(e) => setHasAirstrip(e.target.checked)}
                className="rounded border-[#3f3f46] text-sky-500 focus:ring-0 bg-[#141416]"
              />
              <span>Private Airstrip (30% Faster Flights)</span>
            </label>
          </div>
        </div>

        <div className="text-right text-[#71717a] text-[11px]">
          Rates updated continuously from community stock telemetry
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#222225] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(["ALL", "PLUSHIE", "FLOWER", "DRUG"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === t
                  ? "bg-[#1f1f23] text-white border border-[#3f3f46]"
                  : "text-[#a1a1aa] hover:text-white"
              }`}
            >
              {t === "ALL" && "All Overseas Destinations"}
              {t === "PLUSHIE" && "🧸 Plushies Only"}
              {t === "FLOWER" && "🌸 Flowers Only"}
              {t === "DRUG" && "💊 Drugs (Xanax)"}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            id="travelSearch"
            name="travelSearch"
            aria-label="Search country or item"
            type="text"
            placeholder="Search country or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-[#141416] border border-[#27272a] rounded-lg text-white placeholder-[#71717a] focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDestinations.map((dest) => {
          const flightMinutesOneWay = hasAirstrip
            ? dest.flightMinutesAirstrip
            : dest.flightMinutesStandard;
          const flightHours = (flightMinutesOneWay / 60).toFixed(1);
          const roundTripMinutes = flightMinutesOneWay * 2;

          const profitPerItem = dest.tornMarketValue - dest.localCost;
          const totalProfitRun = profitPerItem * carryCapacity;
          const profitPerHour = Math.round((totalProfitRun / roundTripMinutes) * 60);

          const isStockLow = dest.stockCount < 200;

          return (
            <div
              key={dest.id}
              className="p-4 rounded-xl bg-[#0d0d0f] border border-[#222225] hover:border-[#333338] flex flex-col justify-between transition-all"
            >
              <div>
                {/* Header: Flag, Country & Stock Indicator */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{dest.flag}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{dest.country}</div>
                      <div className="text-[11px] text-[#71717a] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {flightMinutesOneWay}m flight ({flightHours}h)
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                        isStockLow
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {dest.stockCount.toLocaleString()} In Stock
                    </span>
                    <div className="text-[10px] text-[#71717a] mt-0.5">Updated {dest.lastUpdated}</div>
                  </div>
                </div>

                {/* Featured Item & Price Comparison */}
                <div className="p-3 rounded-lg bg-[#141416] border border-[#222225] mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-sky-400" />
                      {dest.featuredItem}
                    </span>
                    <span className="text-[11px] text-[#71717a]">{dest.itemType}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1f1f23] text-xs">
                    <div>
                      <div className="text-[10px] text-[#71717a]">Buy Overseas</div>
                      <div className="font-mono text-white">${dest.localCost.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[#71717a]">Sell Torn Market</div>
                      <div className="font-mono text-emerald-400">
                        ${dest.tornMarketValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Profit Projection */}
                <div className="mt-3 pt-3 border-t border-[#1f1f23] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#a1a1aa]">Run Profit ({carryCapacity} items):</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      +${totalProfitRun.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#71717a]">Yield Velocity:</span>
                    <span className="font-mono text-sky-400">
                      ${profitPerHour.toLocaleString()}/hr
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 pt-2">
                <Link
                  href={`https://www.torn.com/travelagency.php`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#1a1a1e] hover:bg-sky-600 hover:text-white text-[#a1a1aa] border border-[#27272a] hover:border-sky-500 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plane className="w-3 h-3" />
                  Fly to {dest.country}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

> 🧠 **Obsidian Hub**: [[_Brain/Projects/Torn|Torn]] · [[Antigravity/Torn/CONTEXT|Torn/CONTEXT.md]]

# 🏙️ Torn Faction Operations Suite

An end-to-end, high-performance, Terms-of-Service-compliant operations suite for Torn City factions.

Built as a modern TypeScript Turborepo monorepo featuring a **Next.js 15 Web Dashboard**, **Discord.js v14 War Watchdog Bot**, **Prisma PostgreSQL (Supabase)** persistence, and **Custom Tampermonkey Userscripts**.

---

## 🚀 Core Systems

| Module | Purpose & Capabilities | Tech Stack |
|---|---|---|
| **1. Discord War Bot & Watchdog** | • Live Chain Alerting (<120s ⚠️, <60s 🚨, <30s 🔥).<br>• Automated Enemy Hospital Callouts.<br>• 24h Enemy Activity & Sleep Heatmap. | Discord.js v14, Node.js, Torn API v2 |
| **2. War Payout Calculator** | • Fair-Share formula engine (hits, respect, fair fight, clutch saves).<br>• 1-Click JSON export for Torn payout userscripts & CSV export. | `@torn/shared`, React 19, Tailwind v4 |
| **3. OC 2.0 Team Optimizer** | • Optimal member slot recommendation by skill proficiency.<br>• Stalled invitation detection & 1-click Discord nudge alerts. | Bipartite Skill Matcher, Prisma |
| **4. Tampermonkey Userscripts** | • Target Filters on war pages (`torn-target-filters.user.js`).<br>• Armory Restock Warning (`torn-armory-warning.user.js`).<br>• Desktop Energy & Travel Notifier (`torn-energy-travel-notifier.user.js`). | Vanilla JS, Tampermonkey API |
| **5. Faction Vault & Banking** | • Automated deposit tracking via `fundsnews`.<br>• `/withdraw` queue with 1-click batch copy strings for in-game transfers. | Supabase PostgreSQL, Discord Slash |
| **6. Baldr's Leveling Targets** | • Searchable directory of high-XP / low-stat inactive players.<br>• Live hospital/status checks and direct attack buttons. | Next.js 15, Direct URL Routing |
| **7. Member Kanban Board** | • Faction-wide war objectives and personal member checklists.<br>• Status transitions (Todo, In Progress, Done). | Next.js 15, Lucide Icons |

---

## 🔒 Torn API & ToS Compliance

1. **Strict 100 Requests/Minute Rate Limiter**: Managed token-bucket queue in `@torn/api` that never exceeds rolling limits.
2. **API Key Pooling**: Allows members to donate limited keys to multiply faction capacity across read-only endpoints without exposing keys.
3. **Zero In-Game Automation**: 100% compliant with Torn Terms of Service — scripts and bots provide telemetry and overlays only; every game attack or vault transfer requires manual human clicks.

---

## 📁 Repository Structure

```
.
├── apps/
│   ├── web/                    # Next.js 15 App Router Web Dashboard
│   └── bot/                    # Discord.js v14 Bot & Realtime Watchdogs
├── packages/
│   ├── db/                     # Prisma ORM Schema & Client (Supabase/PostgreSQL)
│   ├── torn-api/               # Torn v2 API Client, Rate Limiter & Key Pool
│   └── shared/                 # Domain Types, Payout & OC Math Engines
└── userscripts/                # Standalone Tampermonkey browser scripts
    ├── torn-target-filters.user.js
    ├── torn-armory-warning.user.js
    └── torn-energy-travel-notifier.user.js
```

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

### 3. Generate Prisma Client
```bash
pnpm --filter @torn/db db:generate
```

### 4. Run Development Services
```bash
# Start Next.js Web Dashboard (http://localhost:3000)
pnpm --filter @torn/web dev

# Start Discord War Bot & Watchdogs
pnpm --filter @torn/bot dev
```

### 5. Install Userscripts
Open any script in `userscripts/` in your browser with Tampermonkey installed (e.g. Chrome, Firefox) and click **Install**.

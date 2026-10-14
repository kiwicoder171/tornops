# TornOps Changelog & Release Tracker

> **Live Deployment URL:** [https://web-ten-dusky-11.vercel.app/](https://web-ten-dusky-11.vercel.app/)  
> **Deployment Rule:** Releases are pushed to Git and Vercel strictly upon explicit user request.

---

## 📋 Torn Forum HTML Source Code (Tools > Source Code `< >`)

*Torn's modern forum editor uses **HTML** under the hood (BBCode was phased out). In your Torn forum reply, click **Tools > Source code** (or the `< >` icon in the toolbar) and paste the exact code below:*

```html
<div style="max-width: 600px; font-family: Arial, sans-serif; line-height: 1.5; color: #d1d5db;">
  
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
      <li><strong style="color: #e5e7eb;">War Room Radar Integration:</strong> Combat estimate badges and radar tooltips injected into the live enemy war roster.</li>
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

</div>
```

---

## 🛠️ Internal Project Ledger (Markdown)

### [0.3.1] — 2026-10-14 (Torn API Official Terms of Service & Security Hardening)
    Torn API Compliance & Player Privacy:
        [COMPLIANCE] Completely eliminated all display of keys, masked keys, or obfuscated keys across the entire platform. Removed mock keys and key pooling interfaces from settings.
        [COMPLIANCE] Built and deployed official ApiTosTable component adhering strictly to Torn API developer rules.
        [COMPLIANCE] Integrated ApiTosTable and explicit ToS consent checkbox into the Connect API Key modal dialog (Header.tsx).
        [COMPLIANCE] Overhauled Settings page (apps/web/src/app/settings/page.tsx) to embed the official ToS table, 1-click local storage erasure, and in-game revocation links.
        [COMPLIANCE] Integrated official API Compliance & ToS section and quick-jump anchor into the user documentation manual (/docs).
        [COMPLIANCE] Enforced strict client-side-only storage (localStorage) for Public Access keys; verified zero database persistence for API keys.
        [PASSED] Production Build: Clean Next.js 15 production build across all 24 routes with zero type/lint errors.

### [0.3.0] — 2026-10-14 (Faction Spy Vault & Fair Fight Reverse Engine)
    Combat & Intel:
        [RELEASED] Fair Fight reverse-engineering solver in packages/shared/src/fair-fight.ts with multi-hit Bayesian intersection.
        [RELEASED] Database models (AttackLogEstimate, TravelStock, FactionSpy) generated in @torn/db.
        [RELEASED] Faction Spy Vault page (apps/web/src/app/spies/page.tsx) with live search, filters, freshness decay tags, and bulk clipboard import.
        [RELEASED] War Room (/war) integration: added FAIR_FIGHT source support, radar combat estimate badge, and auto-sync with Faction Cloud.
        [RELEASED] Navigation links added to Sidebar.tsx and CommandPalette.tsx.
    QA Engineering & UX/UI Audit (Completed):
        [PASSED] Perfect 100/100/100/100 Lighthouse audit across Accessibility, Best Practices, SEO, and Agentic Browsing on both /spies and /war.
        [FIXED] WCAG 2.5.3 (Label in Name): Aligned button accessible names (Bulk Import, Refresh Vault, Solve Opponent Stats, Save to Faction Vault).
        [FIXED] WCAG AA Color Contrast: Elevated text contrast ratios across Sidebar, Header, Heatmap hours, and buttons from 4.0:1 to >8.0:1.
        [PASSED] Filter Permutations QA: 100% verified test matrix across sources (FACTION_SPY, FAIR_FIGHT, TORNSTATS, MANUAL), freshness (<14d, 15-45d, >45d), and stat tiers (<1M, 1M-10M, 10M-100M, >1B).
        [PASSED] Interactive Workflows QA: Tested live FF reverse solver, instant save to cloud vault, bulk clipboard parser, and keyboard navigation (Escape modal dismissal).
        [PASSED] Production Build: Clean Next.js 15 production build across all 23 routes with zero lint or type errors.

### [0.2.0] — 2026-10-12 (Ranked War Intelligence Hub & Cloud Sync)
    Ranked War Intelligence Hub & score projections.
    Combat Modifier detection banner.
    Leader clipboard importer.
    Supabase cloud sync for real-time teammate spy sharing.
    Strict live telemetry sanitization.

### [0.1.0] — 2026-10-09 (Initial Foundation)
    Faction Vault & Banking ledger with fundsnews verification.
    24/7 Timezone heatmap & shift coverage matrix.
    Crimes 2.0 planner base.
    War payout calculator with fair-fight multipliers.
    Baldr's target directory.

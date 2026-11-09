"use client";

import { ShieldCheck, Lock, Database, Users, Eye, Trash2, Key } from "lucide-react";

export function ApiTosTable() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-xl text-left">
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Torn City API Terms of Service (ToS) Disclosure
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          Compliant with Torn API Rules
        </span>
      </div>

      <div className="p-3 bg-cyan-950/30 border-b border-cyan-900/40 text-[11px] text-cyan-300 leading-relaxed flex items-start gap-2">
        <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Strict Public-Only Policy:</strong> TornOps requests and requires{" "}
          <strong>Public Access</strong> keys only. <strong>NEVER</strong> provide a Limited or Full Access key. A
          Public key cannot execute attacks, send messages, or touch your money or inventory.
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-[10px] uppercase">
              <th scope="col" className="px-3.5 py-2.5 w-1/4 font-semibold">Disclosure Item</th>
              <th scope="col" className="px-3.5 py-2.5 w-1/4 font-semibold">Policy &amp; Level</th>
              <th scope="col" className="px-3.5 py-2.5 w-1/2 font-semibold">Full Specification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            <tr className="hover:bg-slate-900/30 transition-colors">
              <td className="px-3.5 py-2.5 font-medium text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Key Access Level
              </td>
              <td className="px-3.5 py-2.5 font-mono text-emerald-400 font-semibold">
                Public Access Only
              </td>
              <td className="px-3.5 py-2.5 text-slate-300">
                Minimum access level required. Used exclusively for read-only user identification (<code className="text-cyan-300 font-mono">user.profile</code>, <code className="text-cyan-300 font-mono">user.bars</code>) and faction status (<code className="text-cyan-300 font-mono">faction.basic</code>, <code className="text-cyan-300 font-mono">faction.chain</code>).
              </td>
            </tr>

            <tr className="hover:bg-slate-900/30 transition-colors">
              <td className="px-3.5 py-2.5 font-medium text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Key Storage
              </td>
              <td className="px-3.5 py-2.5 font-mono text-emerald-400 font-semibold">
                Client-Side (Local Only)
              </td>
              <td className="px-3.5 py-2.5 text-slate-300">
                Stored strictly in your local device browser (<code className="text-cyan-300 font-mono">localStorage</code>). Your raw API key is <strong className="text-white">never</strong> stored in any centralized server database and is never exposed or logged.
              </td>
            </tr>

            <tr className="hover:bg-slate-900/30 transition-colors">
              <td className="px-3.5 py-2.5 font-medium text-white flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Key Sharing &amp; Visibility
              </td>
              <td className="px-3.5 py-2.5 font-mono text-emerald-400 font-semibold">
                Zero Sharing (Private)
              </td>
              <td className="px-3.5 py-2.5 text-slate-300">
                Your API key is never shared with, visible to, or pooled with any other players, leaders, or administrators. No keys or partial keys are ever displayed on-screen.
              </td>
            </tr>

            <tr className="hover:bg-slate-900/30 transition-colors">
              <td className="px-3.5 py-2.5 font-medium text-white flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Data Storage
              </td>
              <td className="px-3.5 py-2.5 font-mono text-amber-400 font-semibold">
                Transient Cache + Faction Intel
              </td>
              <td className="px-3.5 py-2.5 text-slate-300">
                Account vitals and cooldowns are cached in local browser memory only. Shared faction combat dossiers (enemy battle stat estimates and attack logs voluntarily submitted) are stored in your faction&apos;s private database until removed by leadership.
              </td>
            </tr>

            <tr className="hover:bg-slate-900/30 transition-colors">
              <td className="px-3.5 py-2.5 font-medium text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Data Sharing
              </td>
              <td className="px-3.5 py-2.5 font-mono text-amber-400 font-semibold">
                Faction Members Only
              </td>
              <td className="px-3.5 py-2.5 text-slate-300">
                Shared enemy spy records and ranked war telemetry are accessible solely to authenticated members of your own faction. Personal account info is never sold, brokered, or shared with third parties.
              </td>
            </tr>

            <tr className="hover:bg-slate-900/30 transition-colors">
              <td className="px-3.5 py-2.5 font-medium text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Purpose of Use
              </td>
              <td className="px-3.5 py-2.5 font-mono text-cyan-300 font-semibold">
                Faction Operations &amp; War
              </td>
              <td className="px-3.5 py-2.5 text-slate-300">
                Real-time chain timing alerts, Ranked War enemy hospital tracking, shift coverage coordination, and Fair Fight combat calculations.
              </td>
            </tr>

            <tr className="hover:bg-slate-900/30 transition-colors">
              <td className="px-3.5 py-2.5 font-medium text-white flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                Deletion &amp; Revocation
              </td>
              <td className="px-3.5 py-2.5 font-mono text-rose-400 font-semibold">
                Instant 1-Click
              </td>
              <td className="px-3.5 py-2.5 text-slate-300">
                Clicking &quot;Disconnect&quot; instantly erases your API key and cached data from your browser storage. You can also delete or revoke your key immediately in your{" "}
                <a
                  href="https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=TornOps&type=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  Torn Preferences &gt; API
                </a>.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

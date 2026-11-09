"use client";

import { useState } from "react";
import {
  Key,
  ShieldCheck,
  Check,
  Trash2,
  Lock,
  ExternalLink,
  AlertCircle,
  Loader2,
  Server,
  Info,
} from "lucide-react";
import { useTorn } from "@/context/TornContext";
import { ApiTosTable } from "@/components/ApiTosTable";

export default function SettingsPage() {
  const { isLive, userProfile, saveApiKey, disconnect, isLoading, error } = useTorn();
  const [newKey, setNewKey] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    if (!tosAccepted) {
      setFormError("You must read and agree to the Torn API Terms of Service disclosure below.");
      return;
    }

    setFormError(null);
    setSubmitting(true);
    const success = await saveApiKey(newKey.trim());
    setSubmitting(false);

    if (success) {
      setNewKey("");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      setFormError(error || "Invalid Torn API Key. Please verify that this is a valid 16-character Public key.");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Security &amp; API Compliance</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
          API Connection &amp; Compliance Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure your Torn v2 Public API connection in full compliance with Torn City developer rules and privacy standards.
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Connection Status
            </span>
            <div className="mt-1 flex items-center gap-2.5">
              {isLive ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-lg font-bold text-white">Active (Client-Side Storage)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Public Key
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="text-lg font-bold text-white">Disconnected (Demo Mode)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Simulation Only
                  </span>
                </>
              )}
            </div>
          </div>

          {isLive && (
            <button
              onClick={disconnect}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-300 hover:text-white border border-red-900/50 rounded-xl text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Disconnect &amp; Erase Key</span>
            </button>
          )}
        </div>

        {/* Identity & Storage Specs */}
        {isLive && userProfile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-mono">Connected Player</span>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{userProfile.name}</span>
                <span className="text-xs font-mono text-cyan-400">[{userProfile.playerId}]</span>
              </div>
              <p className="text-[11px] text-slate-400">Level {userProfile.level} &bull; {userProfile.factionName || "No Faction"}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-mono">Key Storage Location</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Browser LocalStorage</span>
              </div>
              <p className="text-[11px] text-slate-400">Never transmitted to server database</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-mono">Key Privacy &amp; Sharing</span>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Private (Zero Display)</span>
              </div>
              <p className="text-[11px] text-slate-400">No obfuscated or masked keys displayed</p>
            </div>
          </div>
        ) : (
          /* Disconnected State: Input Form with ToS */
          <form onSubmit={handleConnect} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="settingsApiKeyInput" className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" /> Enter Torn Public API Key
                </label>
                <a
                  href="https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=TornOps&type=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 underline"
                >
                  <span>Auto-Generate Public Key on Torn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  id="settingsApiKeyInput"
                  name="apiKey"
                  type="password"
                  autoComplete="off"
                  placeholder="Paste 16-character Public API Key..."
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                />
                <button
                  type="submit"
                  disabled={!newKey.trim() || !tosAccepted || submitting || isLoading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition shrink-0 w-full sm:w-auto shadow-lg shadow-blue-950/50"
                >
                  {submitting || isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Connect API Key</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Only <strong>Public Access</strong> is required. Your key is stored strictly on your local browser and is never saved to a server database or exposed to others.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            {savedSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>API Key connected and validated successfully!</span>
              </div>
            )}

            {/* Explicit ToS Agreement Checkbox */}
            <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                I have reviewed and agree to the <strong>Torn API Terms of Service disclosure</strong> below. I understand that my key remains strictly on this local device and is used solely for read-only faction intelligence.
              </span>
            </label>
          </form>
        )}
      </div>

      {/* Mandatory Official Torn API Terms of Service (ToS) Disclosure Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official Torn API Terms of Service (ToS) Table</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Mandated by Torn City Rules</span>
        </div>
        <ApiTosTable />
      </div>

      {/* Key Management & Revocation Guidance */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Key Revocation &amp; Security Guarantee</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          TornOps respects player security above all else. Under no circumstances does TornOps pool, share, or display your API key or partial key to any other player or administrator. You retain 100% control over your key at all times:
        </p>
        <ul className="space-y-2 text-xs text-slate-300 pl-4 list-disc">
          <li>
            <strong className="text-white">1-Click Local Erasure:</strong> Clicking &quot;Disconnect &amp; Erase Key&quot; immediately wipes the key from your browser storage and returns TornOps to demo mode.
          </li>
          <li>
            <strong className="text-white">In-Game Immediate Revocation:</strong> You can permanently invalidate or delete your key at any second directly in Torn City under{" "}
            <a
              href="https://www.torn.com/preferences.php#tab=api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline hover:text-cyan-300 font-mono"
            >
              Preferences &gt; API
            </a>.
          </li>
          <li>
            <strong className="text-white">Minimum Privilege:</strong> Always supply a Public Access key. Do not provide Limited or Full Access keys to any third-party website.
          </li>
        </ul>
      </div>

      {/* Client Rate Limiting Telemetry */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Client-Side Rate Limit Budget
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">100</span>
            <span className="text-xs text-slate-400">max requests / minute per client</span>
          </div>
          <p className="text-xs text-emerald-400 mt-1">
            ✓ Built-in token-bucket throttler ensures your key never triggers HTTP 429 rate limit errors on Torn servers.
          </p>
        </div>

        <div className="w-full sm:w-64 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Rate Limit Protection</span>
            <span className="font-mono text-emerald-400 font-bold">100% Safe</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[10%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

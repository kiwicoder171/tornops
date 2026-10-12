"use client";

import { useState } from "react";
import { Settings, Key, ShieldCheck, Check, Plus, Trash2, RefreshCw } from "lucide-react";
import { maskApiKey } from "@torn/shared";


interface PooledKeyItem {
  id: string;
  maskedKey: string;
  type: "FACTION" | "MEMBER";
  contributor: string;
  callsLastMinute: number;
  status: "Active" | "Cooling Down";
}

const mockKeys: PooledKeyItem[] = [
  { id: "k-1", maskedKey: "t7x9...20a1", type: "FACTION", contributor: "ApexCommander (Leader)", callsLastMinute: 24, status: "Active" },
  { id: "k-2", maskedKey: "b4m1...99ef", type: "MEMBER", contributor: "Valkyrie", callsLastMinute: 11, status: "Active" },
  { id: "k-3", maskedKey: "k8p3...44aa", type: "MEMBER", contributor: "BlitzGunslinger", callsLastMinute: 8, status: "Active" },
];

export default function SettingsPage() {
  const [keys, setKeys] = useState(mockKeys);
  const [newKey, setNewKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    const item: PooledKeyItem = {
      id: `key-${Date.now()}`,
      maskedKey: maskApiKey(newKey),
      type: "MEMBER",
      contributor: "You (Member)",
      callsLastMinute: 0,
      status: "Active",
    };

    setKeys([...keys, item]);
    setNewKey("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemoveKey = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Settings & Key Pool</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage Torn v2 API keys, distributed rate limiting, and Discord bot integration.
        </p>
      </div>

      {/* Rate Limiter Telemetry */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Token-Bucket Capacity
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">43</span>
            <span className="text-sm text-slate-400">/ 300 rolling req/min across {keys.length} pooled keys</span>
          </div>
          <p className="text-xs text-emerald-400 mt-1">
            ✓ Healthy: Zero rate-limit throttling detected in the last 24 hours.
          </p>
        </div>

        <div className="w-full sm:w-64 bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Pool Saturation</span>
            <span className="font-mono text-white font-bold">14.3%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[14.3%]" />
          </div>
        </div>
      </div>

      {/* Key Pool Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-400" /> Active Torn API Key Pool
          </h2>
          <p className="text-xs text-slate-400">
            Keys are encrypted with AES-256-GCM at rest and rotated to ensure rolling limit compliance.
          </p>
        </div>

        <div className="divide-y divide-slate-800">
          {keys.map((k) => (
            <div key={k.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 text-slate-300 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-white">{k.maskedKey}</span>
                    <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 uppercase font-mono">
                      {k.type}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Contributed by: {k.contributor}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-slate-400">
                  {k.callsLastMinute} req / min
                </span>
                {k.type === "MEMBER" && (
                  <button
                    onClick={() => handleRemoveKey(k.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Key Form */}
        <form onSubmit={handleAddKey} className="p-5 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <input
            id="poolApiKey"
            name="poolApiKey"
            aria-label="Add personal API key to pool"
            autoComplete="off"
            type="password"
            placeholder="Add personal API key to help faction war polling..."
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" /> Add Key to Pool
          </button>
        </form>
      </div>
    </div>
  );
}

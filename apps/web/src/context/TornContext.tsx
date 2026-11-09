"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type SuiteMode = "all" | "faction" | "citizen";

export interface TornUserProfile {
  playerId: number;
  name: string;
  level: number;
  factionId?: number;
  factionName?: string;
  position?: string;
  isLeader?: boolean;
  isCoLeader?: boolean;
  hasAA?: boolean;
  energy?: { current: number; max: number };
  nerve?: { current: number; max: number };
  happy?: { current: number; max: number };
  life?: { current: number; max: number };
  status?: { description: string; state: string; color: string; until?: number };
}

interface TornContextType {
  apiKey: string;
  maskedKey: string;
  isLive: boolean;
  isLoading: boolean;
  userProfile: TornUserProfile | null;
  error: string | null;
  saveApiKey: (key: string) => Promise<boolean>;
  disconnect: () => void;
  suiteMode: SuiteMode;
  setSuiteMode: (mode: SuiteMode) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
}

const TornContext = createContext<TornContextType | undefined>(undefined);

const STORAGE_KEY = "TORN_SUITE_USER_API_KEY";

export function TornProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string>("");
  const [userProfile, setUserProfile] = useState<TornUserProfile | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [suiteMode, setSuiteModeState] = useState<SuiteMode>("all");

  const setSuiteMode = (mode: SuiteMode) => {
    setSuiteModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("TORN_SUITE_MODE", mode);
    }
  };

  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);

  // Validate and load profile from an API key
  const validateAndLoad = async (key: string): Promise<boolean> => {
    if (!key || key.trim() === "") return false;
    setIsLoading(true);
    setError(null);

    try {
      // First, fetch user profile with Public Access selection (supported by all 16-char Public keys)
      const res = await fetch(`/api/torn/user?selections=profile&key=${encodeURIComponent(key.trim())}`);
      const data = await res.json();

      if (data.error) {
        setError(`Torn API Error [${data.error.code || 400}]: ${data.error.error || "Invalid API Key"}`);
        setIsLoading(false);
        return false;
      }

      const rawProfile = data.profile || data;
      const playerId = rawProfile.id || rawProfile.player_id;
      const name = rawProfile.name;
      const level = rawProfile.level || 0;
      const factionId = rawProfile.faction_id || data.faction?.faction_id || data.faction?.id;

      let factionName = data.faction?.faction_name || data.faction?.name;
      let position = data.faction?.position || rawProfile.rank || (factionId ? "Member" : "Unaligned");
      let isLeader = false;
      let isCoLeader = false;

      // If factionId exists, fetch faction basic info to check leadership & co-leadership
      if (factionId && Number(factionId) > 0) {
        try {
          const facRes = await fetch(`/api/torn/faction?selections=basic&key=${encodeURIComponent(key.trim())}`);
          const facData = await facRes.json();
          const fname = facData.name || facData.basic?.name || facData.tag;
          if (fname) {
            factionName = fname;
          }
          const leaderId = facData.leader_id ?? facData.basic?.leader_id ?? facData.leader;
          const coLeaderId = facData.co_leader_id ?? facData.basic?.co_leader_id ?? facData.co_leader;
          isLeader = playerId === leaderId;
          isCoLeader = playerId === coLeaderId;
        } catch {
          // Keep fallback
        }
      }

      const posLower = (position || "").toLowerCase();
      if (!isLeader && posLower === "leader") isLeader = true;
      if (!isCoLeader && (posLower.includes("co-leader") || posLower.includes("coleader"))) isCoLeader = true;
      const hasAA = isLeader || isCoLeader;

      // Optional progressive enhancement: attempt to fetch bars if key has Minimal Access or above
      let energy = undefined;
      let nerve = undefined;
      let happy = undefined;
      let life = data.life ? { current: data.life.current, max: data.life.maximum } : undefined;

      try {
        const barsRes = await fetch(`/api/torn/user?selections=bars&key=${encodeURIComponent(key.trim())}`);
        const barsData = await barsRes.json();
        if (barsData && !barsData.error) {
          if (barsData.energy) energy = { current: barsData.energy.current, max: barsData.energy.maximum };
          if (barsData.nerve) nerve = { current: barsData.nerve.current, max: barsData.nerve.maximum };
          if (barsData.happy) happy = { current: barsData.happy.current, max: barsData.happy.maximum };
          if (barsData.life) life = { current: barsData.life.current, max: barsData.life.maximum };
        }
      } catch {
        // Bars is optional; keep public life data from profile
      }

      const profile: TornUserProfile = {
        playerId,
        name,
        level,
        factionId,
        factionName,
        position,
        isLeader,
        isCoLeader,
        hasAA,
        energy,
        nerve,
        happy,
        life,
        status: data.status ? { description: data.status.description, state: data.status.state, color: data.status.color, until: data.status.until } : undefined,
      };

      setApiKey(key.trim());
      setUserProfile(profile);
      setIsLive(true);
      localStorage.setItem(STORAGE_KEY, key.trim());

      setIsLoading(false);
      return true;
    } catch (err) {
      setError(`Failed to connect to Torn API: ${(err as Error).message}`);
      setIsLoading(false);
      return false;
    }
  };

  // Restore saved key & suite mode from localStorage on initial load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      validateAndLoad(saved);
    }
    const savedMode = localStorage.getItem("TORN_SUITE_MODE") as SuiteMode;
    if (savedMode && (savedMode === "all" || savedMode === "faction" || savedMode === "citizen")) {
      setSuiteModeState(savedMode);
    }
  }, []);

  const saveApiKey = async (newKey: string): Promise<boolean> => {
    return await validateAndLoad(newKey);
  };

  const disconnect = () => {
    setApiKey("");
    setUserProfile(null);
    setIsLive(false);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <TornContext.Provider
      value={{
        apiKey,
        maskedKey: "",
        isLive,
        isLoading,
        userProfile,
        error,
        saveApiKey,
        disconnect,
        suiteMode,
        setSuiteMode,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleMobileSidebar,
      }}
    >
      {children}
    </TornContext.Provider>
  );
}

export function useTorn() {
  const context = useContext(TornContext);
  if (!context) {
    throw new Error("useTorn must be used within a TornProvider");
  }
  return context;
}

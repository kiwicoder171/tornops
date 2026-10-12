"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { maskApiKey } from "@torn/shared";

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
}

const TornContext = createContext<TornContextType | undefined>(undefined);

const STORAGE_KEY = "TORN_SUITE_USER_API_KEY";

export function TornProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string>("");
  const [userProfile, setUserProfile] = useState<TornUserProfile | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Validate and load profile from an API key
  const validateAndLoad = async (key: string): Promise<boolean> => {
    if (!key || key.trim() === "") return false;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/torn/user?selections=profile,bars&key=${encodeURIComponent(key.trim())}`);
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

      let factionName = data.faction?.faction_name || data.faction?.name || "Mildly Dangerous";
      let position = data.faction?.position || rawProfile.rank || "Member";
      let isLeader = false;
      let isCoLeader = false;

      // If factionId exists, fetch faction basic info to check leadership & co-leadership
      if (factionId) {
        try {
          const facRes = await fetch(`/api/torn/faction?selections=basic&key=${encodeURIComponent(key.trim())}`);
          const facData = await facRes.json();
          if (facData.basic) {
            factionName = facData.basic.name || factionName;
            isLeader = playerId === facData.basic.leader_id;
            isCoLeader = playerId === facData.basic.co_leader_id;
          }
        } catch {
          // Keep fallback
        }
      }

      const posLower = (position || "").toLowerCase();
      if (!isLeader && posLower === "leader") isLeader = true;
      if (!isCoLeader && (posLower.includes("co-leader") || posLower.includes("coleader"))) isCoLeader = true;
      const hasAA = isLeader || isCoLeader;

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
        energy: data.energy ? { current: data.energy.current, max: data.energy.maximum } : undefined,
        nerve: data.nerve ? { current: data.nerve.current, max: data.nerve.maximum } : undefined,
        happy: data.happy ? { current: data.happy.current, max: data.happy.maximum } : undefined,
        life: data.life ? { current: data.life.current, max: data.life.maximum } : undefined,
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

  // Restore saved key from localStorage on initial load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      validateAndLoad(saved);
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
        maskedKey: apiKey ? maskApiKey(apiKey) : "",
        isLive,
        isLoading,
        userProfile,
        error,
        saveApiKey,
        disconnect,
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

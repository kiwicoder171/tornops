import { z } from "zod";

// --- Torn Core Types ---
export interface TornUser {
  playerId: number;
  name: string;
  level: number;
  gender: string;
  status: {
    description: string;
    details: string;
    state: "Okay" | "Hospital" | "Jail" | "Traveling" | "Abroad" | "Fallen";
    until: number;
  };
  lastAction: {
    status: "Online" | "Idle" | "Offline";
    timestamp: number;
    relative: string;
  };
}

export interface FactionMember {
  id: number;
  name: string;
  level: number;
  daysInFaction: number;
  position: string;
  status: TornUser["status"];
  lastAction: TornUser["lastAction"];
}

// --- Chain & War Watchdog Types ---
export interface ChainStatus {
  current: number;
  max: number;
  timeout: number; // Seconds remaining in chain timer
  modifier: number;
  cooldown: number;
  start: number;
  end: number;
}

export type ChainAlertLevel = "NORMAL" | "WARNING_120" | "HIGH_60" | "EMERGENCY_30";

export interface RankedWarData {
  warId: number;
  factions: {
    [factionId: string]: {
      name: string;
      score: number;
      chain: number;
    };
  };
  start: number;
  end: number;
  target: number;
  lead: number;
}

import type { DefenderLoadout } from "./loadout.js";

export interface HospitalCalloutTarget {
  playerId: number;
  name: string;
  level: number;
  factionId: number;
  factionName: string;
  hospitalUntil: number;
  estimatedStats?: string;
  directAttackUrl: string;
  armorSet?: string;
  weaponBonuses?: string;
  loadout?: DefenderLoadout;
}

export interface ActivityHeatmapSlot {
  hourUTC: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  activeCount: number;
  idleCount: number;
  offlineCount: number;
  totalMembers: number;
  activityPercentage: number;
}

// --- War Payout & Fair-Share Calculator Types ---
export interface AttackRecord {
  code: string;
  timestampStarted: number;
  timestampEnded: number;
  attackerId: number;
  attackerName: string;
  attackerFactionId: number;
  defenderId: number;
  defenderName: string;
  defenderFactionId: number;
  result: "Attacked" | "Mugged" | "Hospitalized" | "Lost" | "Draw" | "Escape" | "Interrupted" | "Assist";
  respectGain: number;
  chain: number;
  fairFight: number;
  isClutchSave?: boolean; // Hit made with < 30 seconds left on chain
}

export interface PayoutFormulaWeights {
  basePayPerHit: number;          // Fixed cash per successful hit
  respectWeight: number;          // Multiplier per respect earned
  assistPay: number;              // Pay per assist hit
  clutchSaveBonus: number;        // Flat bonus for clutch chain saves (<30s)
  lossPenalty: number;            // Deduction for lost attacks
  fairFightMultiplier: number;    // Multiplier based on fairFight ratio
}

export interface MemberPayoutResult {
  playerId: number;
  playerName: string;
  hits: number;
  assists: number;
  losses: number;
  clutchSaves: number;
  totalRespect: number;
  rawScore: number;
  percentageOfPool: number;
  finalPayout: number; // In Torn cash dollars
}

export interface WarPayoutCalculation {
  warId: number;
  totalCashPool: number;
  weights: PayoutFormulaWeights;
  totalHits: number;
  totalRespect: number;
  totalAssists: number;
  memberPayouts: MemberPayoutResult[];
}

// --- Crimes 2.0 / OC Optimizer Types ---
export type CrimeSkillType =
  | "searchForCash"
  | "bootlegging"
  | "graffiti"
  | "shoplifting"
  | "pickpocketing"
  | "cardsSkimming"
  | "burglary"
  | "hustling"
  | "disposal"
  | "cracking"
  | "forgery"
  | "scamming"
  | "cybercrime"
  | "extortion"
  | "illicitServices";

export interface MemberCrimeProficiency {
  playerId: number;
  playerName: string;
  skills: Record<CrimeSkillType, number>; // Skill level 0 - 100
  isAvailable: boolean;
  activeCrimeId?: number;
  pendingInviteCrimeId?: number;
  inviteSentTimestamp?: number;
}

export interface CrimeSlotRequirement {
  slotIndex: number;
  slotName: string;
  primarySkill: CrimeSkillType;
  minSkillLevel: number;
  recommendedSkillLevel: number;
}

export interface CrimeTeamTemplate {
  crimeTypeId: number;
  crimeName: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  slots: CrimeSlotRequirement[];
}

export interface OptimizedSlotAssignment {
  slotIndex: number;
  slotName: string;
  assignedPlayerId: number;
  assignedPlayerName: string;
  playerSkillLevel: number;
  requiredSkillLevel: number;
  confidenceScore: number; // 0 - 100%
}

export interface OptimizedCrimeTeam {
  crimeTypeId: number;
  crimeName: string;
  overallSuccessRate: number;
  assignments: OptimizedSlotAssignment[];
}

// --- Faction Banking & Vault Types ---
export interface VaultDepositLog {
  id: number;
  timestamp: number;
  playerId: number;
  playerName: string;
  amount: number;
  type: "money" | "points";
}

export interface WithdrawalRequestItem {
  id: string;
  playerId: number;
  playerName: string;
  amount: number;
  reason?: string;
  status: "PENDING" | "APPROVED" | "FULFILLED" | "REJECTED";
  requestedAt: number;
  fulfilledAt?: number;
  fulfilledBy?: string;
}

// --- Baldr's Leveling Targets Types ---
export interface LevelingTargetItem {
  id: number;
  name: string;
  level: number;
  estimatedStats?: string;
  status: "Okay" | "Hospital" | "Jail" | "Traveling" | "Abroad" | "Offline";
  hospitalRemainingSeconds?: number;
  notes?: string;
  attackUrl: string;
}

// --- Kanban Task Types ---
export interface KanbanTaskItem {
  id: string;
  title: string;
  description?: string;
  assignedToId?: number;
  assignedToName?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  factionWide: boolean;
  createdAt: number;
  dueDate?: number;
}

// --- Utility Helper ---
export function maskApiKey(key: string): string {
  if (!key) return "[EMPTY]";
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}



import { ChainAlertLevel, ChainStatus } from "./types.js";

/**
 * Evaluates the current chain timer and returns the appropriate alert severity level.
 * @param timeoutSeconds Seconds remaining on current chain
 */
export function getChainAlertLevel(timeoutSeconds: number): ChainAlertLevel {
  if (timeoutSeconds <= 0) return "NORMAL";
  if (timeoutSeconds <= 30) return "EMERGENCY_30";
  if (timeoutSeconds <= 60) return "HIGH_60";
  if (timeoutSeconds <= 120) return "WARNING_120";
  return "NORMAL";
}

/**
 * Determines whether a hit was landed in the critical "clutch" window (<30s).
 */
export function isClutchHit(chainTimeoutAtHit: number): boolean {
  return chainTimeoutAtHit > 0 && chainTimeoutAtHit <= 30;
}

/**
 * Generates direct one-click Torn in-game attack link using modern page.php endpoint.
 */
export function getDirectAttackUrl(targetId: number): string {
  return `https://www.torn.com/page.php?sid=attack&user2ID=${targetId}`;
}


/**
 * Formats seconds into human-readable MM:SS string.
 */
export function formatChainTime(seconds: number): string {
  if (seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

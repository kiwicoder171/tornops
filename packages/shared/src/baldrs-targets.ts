import targetsJson from "./data/baldrs-targets.json" with { type: "json" };

export interface BaldrTarget {
  id: number;
  name: string;
  level: number;
  totalStats: number;
  str: number;
  def: number;
  spd: number;
  dex: number;
  listCategory: string;
}

export const BALDR_TARGETS: BaldrTarget[] = targetsJson as BaldrTarget[];

export const BALDR_LIST_CATEGORIES = [
  "ALL",
  "Baldr's List 1",
  "Baldr's List 2",
  "Baldr's List 3",
  "Baldr's Extra List 1",
  "Baldr's Extra List 2",
  "Baldr's Extra List 3",
  "Baldr's DOMINO List",
] as const;

export type BaldrListCategory = (typeof BALDR_LIST_CATEGORIES)[number];

export function getTargetsByCategory(category: string): BaldrTarget[] {
  if (category === "ALL") return BALDR_TARGETS;
  return BALDR_TARGETS.filter((t) => t.listCategory === category);
}

/**
 * Format targets into standard YATA / TornPDA import format
 */
export function exportToYataFormat(targets: BaldrTarget[]): string {
  const exportPayload = {
    source: "Torn Faction Operations Suite - Baldr's List",
    exportedAt: new Date().toISOString(),
    count: targets.length,
    targets: targets.map((t) => ({
      id: t.id,
      name: t.name,
      level: t.level,
      total_stats: t.totalStats,
      notes: `${t.listCategory} | Total: ${t.totalStats.toLocaleString()} (Str: ${t.str}, Def: ${t.def}, Spd: ${t.spd}, Dex: ${t.dex})`,
    })),
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Export targets as simple text ID list for quick copy
 */
export function exportToIdList(targets: BaldrTarget[]): string {
  return targets.map((t) => `${t.id} - ${t.name} (Lvl ${t.level})`).join("\n");
}

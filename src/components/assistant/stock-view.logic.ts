import type { PillTone } from "@/components/tbd";
import type { DispenseStockItem } from "@/lib/dispense/direct-dispense";

/** Read-only clinic stock view (AsStockView): status tags, ordering and filters. No React, no prices. */

export type StockFilter = "ALL" | "LOW" | "EXPIRING" | "OUT";

type StockFlags = Pick<DispenseStockItem, "status" | "expiringSoon" | "minStockThreshold">;

export function stockStatusMeta(item: StockFlags): { label: string; tone: PillTone } {
  if (item.status === "OUT") return { label: "Out of stock", tone: "rose" };
  if (item.status === "LOW") {
    return { label: item.minStockThreshold > 0 ? `Low · reorder ${item.minStockThreshold}` : "Low stock", tone: "amber" };
  }
  if (item.expiringSoon) return { label: "Near expiry", tone: "amber" };
  return { label: "In stock", tone: "green" };
}

const rank = (item: StockFlags) => (item.status === "OUT" ? 0 : item.status === "LOW" ? 1 : item.expiringSoon ? 2 : 3);

/** Out of stock first, then low, then near expiry, then the rest; by name inside each group. */
export function sortByAttention<T extends StockFlags & { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export function filterStock<T extends StockFlags>(items: readonly T[], filter: StockFilter): T[] {
  switch (filter) {
    case "LOW":
      return items.filter((item) => item.status === "LOW");
    case "OUT":
      return items.filter((item) => item.status === "OUT");
    case "EXPIRING":
      return items.filter((item) => item.expiringSoon);
    default:
      return [...items];
  }
}

export function countStock(items: readonly StockFlags[]): Record<StockFilter, number> {
  return {
    ALL: items.length,
    LOW: items.filter((item) => item.status === "LOW").length,
    OUT: items.filter((item) => item.status === "OUT").length,
    EXPIRING: items.filter((item) => item.expiringSoon).length,
  };
}

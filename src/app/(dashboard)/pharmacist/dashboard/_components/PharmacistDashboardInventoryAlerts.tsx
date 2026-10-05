import Link from "next/link";
import { ChevronRight, CircleAlert, CircleCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/loading";
import { EmptyBlock, Surface } from "@/components/tbd";
import type { InventorySummary, StockAlert } from "./pharmacist-dashboard.logic";

interface PharmacistDashboardInventoryAlertsProps {
  inventory: InventorySummary;
  loading?: boolean;
  errorMessage?: string | null;
  addStockHref: string;
  restockHref: (alert: StockAlert) => string;
  /** Inventory list filtered to low stock. */
  lowStockHref: string;
}

const VISIBLE_ALERTS = 3;

function countPhrase(inventory: InventorySummary): string {
  const parts: string[] = [];
  if (inventory.lowCount > 0) parts.push(`${inventory.lowCount} low stock`);
  if (inventory.outCount > 0) parts.push(`${inventory.outCount} out of stock`);
  return `${parts.join(" and ")}. Restock before they are prescribed again.`;
}

/** Low and out-of-stock medicines, worst first, each with a Restock link to the inventory screen. */
export function PharmacistDashboardInventoryAlerts({
  inventory,
  loading = false,
  errorMessage = null,
  addStockHref,
  restockHref,
  lowStockHref,
}: PharmacistDashboardInventoryAlertsProps) {
  const visible = inventory.alerts.slice(0, VISIBLE_ALERTS);
  const more = inventory.alerts.length - visible.length;

  return (
    <Surface as="section" className="gap-2.5 p-[18px]" aria-labelledby="pharmacy-alerts-title">
      <div className="flex items-center gap-2.5">
        <CircleAlert className="size-[18px] shrink-0 text-[#e11d48] dark:text-rose-300" strokeWidth={2.2} aria-hidden="true" />
        <h2 id="pharmacy-alerts-title" className="m-0 flex-1 text-base font-bold text-ink">
          Inventory Alerts
        </h2>
        <Button asChild variant="outline" className="h-[34px]">
          <Link href={addStockHref}>
            <Plus aria-hidden="true" />
            Add Stock
          </Link>
        </Button>
      </div>

      {loading ? (
        <div aria-busy="true">
          <SkeletonList items={3} />
        </div>
      ) : errorMessage ? (
        <p className="m-0 text-[13px] leading-normal text-[#be123c] dark:text-rose-300" role="alert">
          Stock levels could not be loaded. {errorMessage}
        </p>
      ) : inventory.alerts.length === 0 ? (
        <EmptyBlock
          icon={CircleCheck}
          title="All inventory levels normal"
          description="Nothing is below the configured low-stock threshold right now."
          className="px-0 py-6"
        />
      ) : (
        <>
          <p className="m-0 text-[13px] leading-normal text-ink-muted">{countPhrase(inventory)}</p>
          <ul className="m-0 flex list-none flex-col p-0">
            {visible.map((alert) => (
              <li key={alert.id} className="flex items-center gap-3 border-b border-hair py-[11px] last:border-b-0">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-bold leading-[1.3] text-ink">{alert.name}</span>
                  <span
                    className={
                      alert.outOfStock
                        ? "text-xs font-bold text-[#e11d48] dark:text-rose-300"
                        : "text-xs font-bold text-[#b45309] dark:text-amber-300"
                    }
                  >
                    {alert.outOfStock ? "Out of stock" : `Stock: ${alert.stock} ${alert.unit}`}
                    {alert.reorderAt > 0 ? ` · reorder at ${alert.reorderAt}` : ""}
                  </span>
                </span>
                <Button asChild variant="soft" className="h-[34px]">
                  <Link href={restockHref(alert)} aria-label={`Restock ${alert.name}`}>
                    Restock
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
          {more > 0 ? (
            <Link
              href={lowStockHref}
              className="flex min-h-10 items-center justify-between gap-2.5 rounded-xl border border-hair bg-[#f8fafc] px-3 text-[13px] font-bold text-ink hover:bg-mint-soft dark:bg-white/5"
            >
              <span>
                {more} more {more === 1 ? "medicine is" : "medicines are"} low
              </span>
              <ChevronRight className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
            </Link>
          ) : null}
        </>
      )}
    </Surface>
  );
}

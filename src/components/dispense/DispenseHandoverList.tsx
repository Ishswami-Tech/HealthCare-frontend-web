"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyBlock, Pill } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { expiryLabel, leavesLowStock, stockAfter, type DispenseDraftLine } from "@/lib/dispense/direct-dispense";

/** The hand-over list: quantity per line and what stays on the shelf. The batch is picked on the server (FEFO). */
export function DispenseHandoverList({
  lines,
  onQuantity,
  onRemove,
}: {
  lines: readonly DispenseDraftLine[];
  onQuantity: (medicineId: string, quantity: number) => void;
  onRemove: (medicineId: string) => void;
}) {
  if (lines.length === 0) {
    return <EmptyBlock title="Nothing added yet" description="Add medicines from stock, or load them from the prescription." className="py-6" />;
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {lines.map((line) => {
        const low = leavesLowStock(line);
        const inputId = `dispense-qty-${line.medicineId}`;
        return (
          <li
            key={line.medicineId}
            className={cn(
              "flex flex-col gap-2 rounded-2xl border px-4 py-3",
              low ? "border-[#fcd34d] bg-[#fffbeb] dark:border-amber-800 dark:bg-amber-950/30" : "border-line",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 text-sm font-bold text-ink">{line.name}</span>
              {low ? <Pill tone="amber">Low stock</Pill> : null}
              <Button size="icon-sm" variant="ghost" aria-label={`Remove ${line.name}`} onClick={() => onRemove(line.medicineId)}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
            <span className="text-xs text-ink-muted">
              Earliest batch first (FEFO){line.nearestExpiry ? ` · exp ${expiryLabel(line.nearestExpiry)}` : ""} · picked when you confirm
            </span>
            <div className="flex flex-wrap items-end gap-4">
              <label htmlFor={inputId} className="flex flex-col gap-1">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">
                  Quantity{line.unit ? ` (${line.unit})` : ""}
                </span>
                <Input
                  id={inputId}
                  type="number"
                  min={1}
                  max={line.quantityOnHand}
                  value={line.quantity}
                  onChange={(event) => onQuantity(line.medicineId, Number.parseInt(event.target.value, 10))}
                  className="w-24"
                />
              </label>
              <span className="flex flex-col gap-1">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">Stock after</span>
                <span className="text-sm font-bold text-ink">{stockAfter(line)} left</span>
              </span>
            </div>
            {low && line.minStockThreshold > 0 ? (
              <span className="text-xs text-[#92400e] dark:text-amber-300">Reorder level is {line.minStockThreshold}.</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

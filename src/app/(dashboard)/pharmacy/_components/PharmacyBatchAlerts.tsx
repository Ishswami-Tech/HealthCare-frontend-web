"use client";

import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBox, Pill, Surface } from "@/components/tbd";
import type { BatchAlert } from "./pharmacy-stock.logic";

const VISIBLE_ALERTS = 5;

export interface PharmacyBatchAlertsProps {
  alerts: BatchAlert[];
  /** Opens the batches of the medicine an alert is about. */
  onOpenBatches: (medicineId: string) => void;
}

/**
 * Open stock alerts from the server (batches about to expire, low or empty stock, reorder
 * suggestions). Renders nothing when there are none, so an empty list never takes room.
 */
export function PharmacyBatchAlerts({ alerts, onOpenBatches }: PharmacyBatchAlertsProps) {
  if (alerts.length === 0) return null;
  const shown = alerts.slice(0, VISIBLE_ALERTS);
  return (
    <Surface as="section" className="gap-3" aria-label="Batch and stock alerts">
      <div className="flex items-center gap-3">
        <IconBox icon={BellRing} tone="amber" size={38} />
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <h2 className="m-0 text-base font-bold text-ink">Batch and stock alerts</h2>
          <span className="text-[13px] font-medium text-ink-muted">
            {alerts.length} open {alerts.length === 1 ? "alert" : "alerts"}
            {alerts.length > shown.length ? `, showing the ${shown.length} most urgent` : ""}
          </span>
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {shown.map((alert) => (
          <li
            key={alert.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-hair py-2.5 first:border-t-0"
          >
            <Pill tone={alert.tone}>{alert.label}</Pill>
            <span className="flex min-w-0 flex-1 basis-[220px] flex-col">
              {alert.medicineName ? <span className="truncate text-sm font-bold text-ink">{alert.medicineName}</span> : null}
              <span className="text-[13px] text-ink-soft">{alert.message}</span>
            </span>
            {alert.medicineId ? (
              <Button variant="outline" onClick={() => onOpenBatches(alert.medicineId)}>
                View batches
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Surface>
  );
}

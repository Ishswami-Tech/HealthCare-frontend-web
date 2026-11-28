"use client";

import { useMemo } from "react";
import { SectionTitle, StatTile, Surface } from "@/components/tbd";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useInventory, useInventoryCounts, useMedicineDeskQueue } from "@/hooks/query/usePharmacy";
import {
  buildDeskQueue,
  buildInventorySummary,
  canDispense,
} from "../../dashboard/_components/pharmacist-dashboard.logic";

/** PhNotifications side panel: what the counter should act on now, from the live desk queue and stock. */
export function PharmacistNeedsYouPanel() {
  const { clinicId } = useClinicContext();
  const scopedClinicId = clinicId || "";
  const { data: queueData } = useMedicineDeskQueue(scopedClinicId, !!scopedClinicId);
  const { data: inventoryData } = useInventory(scopedClinicId, { limit: 100 });

  const ready = useMemo(() => buildDeskQueue(queueData).filter(canDispense).length, [queueData]);
  const stock = useMemo(() => buildInventorySummary(inventoryData), [inventoryData]);
  // Server counts: low = 0 < stock <= reorder level, out = stock <= 0 (same on every screen).
  const { data: counts } = useInventoryCounts(scopedClinicId);
  const lowCount = counts?.lowStock ?? stock.lowCount;
  const outCount = counts?.outOfStock ?? stock.outCount;

  return (
    <Surface as="section" aria-label="Needs you now">
      <SectionTitle title="Needs you now" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <StatTile value={ready} label="Prescriptions ready to dispense" tone="brand" href="/pharmacist/prescriptions" className="shadow-none ring-1 ring-hair" />
        <StatTile
          value={lowCount}
          label="Medicines low on stock"
          hint={`${outCount} out of stock`}
          tone="amber"
          href="/pharmacy?filter=low"
          className="shadow-none ring-1 ring-hair"
        />
        <StatTile
          value={stock.expiringSoon ?? 0}
          label="Medicines expiring soon"
          hint="Within the next 90 days"
          tone="rose"
          href="/pharmacy/expiry"
          className="shadow-none ring-1 ring-hair"
        />
      </div>
    </Surface>
  );
}

"use client";

import { CalendarOff } from "lucide-react";
import { EmptyBlock, SectionTitle, SkeletonRows, StatTile, Surface } from "@/components/tbd";
import { LeaveDecisionCard } from "@/components/clinic-admin/LeaveDecisionCard";
import { useLeaveRequests } from "@/hooks/query/useClinicStaffAdmin";
import { useCheckInSummary } from "@/hooks/query/useClinicQr";
import { useClinicInvoicePage } from "@/hooks/query/useBilling";
import { useInventoryCounts } from "@/hooks/query/usePharmacy";
import { useCurrentClinicId } from "@/hooks/query/useClinics";

/**
 * Counts of what needs the clinic admin today, each linking to the screen where it is handled.
 * Shown on the notification centre and on the dashboard.
 */
export function ClinicAdminAlertStrip() {
  const clinicId = useCurrentClinicId();
  const leave = useLeaveRequests({ status: "PENDING" });
  const checkIns = useCheckInSummary();
  // Unpaid = PENDING invoices of the clinic: the same server count as the Invoices page "Pending" chip
  // (overdue ones are a subset, listed on the reminders screen).
  const invoices = useClinicInvoicePage({ page: 1, limit: 1 });
  // Live stock counts (low = 0 < stock <= reorder level, out = stock <= 0), the same numbers as
  // the inventory screens; not the stored alert records, which may lag behind the stock.
  const stock = useInventoryCounts(clinicId || "");
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile tone="amber" label="Leave to decide" value={leave.isPending ? "…" : (leave.data ?? []).length} href="/clinic-admin/notifications" />
      <StatTile tone="rose" label="Failed check-ins today" value={checkIns.data?.unresolvedFailures ?? "…"} href="/clinic-admin/check-ins/failed" />
      <StatTile
        label="Low stock"
        value={stock.data ? stock.data.lowStock : stock.isPending ? "…" : "—"}
        hint={stock.data ? `${stock.data.outOfStock} out of stock` : undefined}
        href="/clinic-admin/inventory"
      />
      <StatTile label="Unpaid invoices" value={invoices.data?.counts.PENDING ?? "…"} href="/clinic-admin/billing/invoices?status=pending" />
    </div>
  );
}

/** "What needs you today" block of the notification centre: the alert strip and pending leave decisions. */
export function ClinicAdminDecisions() {
  const leave = useLeaveRequests({ status: "PENDING" });
  const pending = leave.data ?? [];

  return (
    <>
      <ClinicAdminAlertStrip />
      <Surface as="section" aria-label="Leave requests">
        <SectionTitle title="Need a decision" description="Leave requests from your team" icon={CalendarOff} count={pending.length} />
        {leave.isPending ? (
          <SkeletonRows rows={2} />
        ) : pending.length === 0 ? (
          <EmptyBlock icon={CalendarOff} title="No pending leave requests" />
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((request) => (
              <LeaveDecisionCard key={request.id} leave={request} />
            ))}
          </div>
        )}
      </Surface>
    </>
  );
}

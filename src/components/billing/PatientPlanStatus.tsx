"use client";

import { BadgeCheck, CalendarClock } from "lucide-react";
import { Note } from "@/components/tbd";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveSubscription } from "@/hooks/query/useBilling";
import { formatDateInIST } from "@/lib/utils/date-time";
import { planStatusOf } from "./plan-status.logic";

/**
 * The patient's monthly in-person plan, for staff screens (reception collect / walk-in, clinic
 * admin invoice). In-clinic visits are covered by this plan, not billed per visit. Read only:
 * the patient buys or renews the plan in the app (Plans & billing).
 */
export function PatientPlanStatus({
  clinicId,
  patientUserId,
  className,
}: {
  clinicId: string;
  patientUserId: string;
  className?: string;
}) {
  const active = useActiveSubscription(patientUserId, clinicId, Boolean(patientUserId && clinicId));
  if (!patientUserId || !clinicId) return null;
  if (active.isPending) return <Skeleton className={className ?? "h-12 w-full rounded-xl"} />;
  if (active.error) {
    return (
      <Note tone="blue" className={className}>
        The in-person plan could not be checked right now. Check-in still verifies it.
      </Note>
    );
  }
  const plan = planStatusOf(active.data);
  if (plan.active) {
    const till = plan.activeTill ? formatDateInIST(plan.activeTill) : "";
    return (
      <Note tone="green" icon={BadgeCheck} className={className}>
        <strong>{plan.planName || "In-person plan"}</strong>
        {till ? ` · active till ${till}` : " · active"}
        {plan.visitsLeft !== null ? ` · ${plan.visitsLeft} visit${plan.visitsLeft === 1 ? "" : "s"} left` : ""}.
        In-clinic visits are covered by the plan: no consultation fee.
      </Note>
    );
  }
  return (
    <Note tone="amber" icon={CalendarClock} className={className}>
      <strong>No active in-person plan.</strong> In-clinic visits need an active monthly plan before check-in. The
      patient renews or buys it in the app (Plans &amp; billing).
    </Note>
  );
}

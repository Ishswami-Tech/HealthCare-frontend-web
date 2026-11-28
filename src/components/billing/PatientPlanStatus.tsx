"use client";

import { BadgeCheck, CalendarClock } from "lucide-react";
import { Note } from "@/components/tbd";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveSubscription } from "@/hooks/query/useBilling";
import { useCurrentClinic } from "@/hooks/query/useClinics";
import { formatDateInIST } from "@/lib/utils/date-time";
import { planStatusOf } from "./plan-status.logic";
import { resolveWalkInPlanSettings, walkInFeePhrase } from "./plan-desk-path.logic";

/**
 * The patient's monthly in-person plan, for staff screens (reception collect / walk-in, clinic
 * admin invoice). In-clinic visits are covered by this plan, not billed per visit. Read only:
 * the patient buys the plan in the app, or reception sells it at the desk (Collect payment ->
 * Sell plan; the plan starts once that payment is recorded).
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
  // Not useClinic(clinicId): GET /clinics/:id is ownership-scoped (403 for staff roles like
  // RECEPTIONIST). useCurrentClinic() already routes staff through GET /clinics/my-clinic.
  const clinic = useCurrentClinic();
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
  // Clinic settings rule; unknown settings read as the backend default (REQUIRE_PLAN).
  const rule = resolveWalkInPlanSettings(clinic.data?.settings, clinic.data?.expectedWalkInFee);
  const policy = rule?.policy ?? "REQUIRE_PLAN";
  // Backend-resolved bill (desk fee, else the doctor / clinic consultation fee); settings as fallback.
  const feePhrase = walkInFeePhrase(rule);
  if (policy === "ALLOW_FREE") {
    return (
      <Note tone="blue" icon={CalendarClock} className={className}>
        <strong>No active in-person plan.</strong> This clinic allows plan-less walk-ins as a free visit — go ahead
        and check the patient in.
      </Note>
    );
  }
  if (policy === "ALLOW_WITH_DESK_FEE") {
    return (
      <Note tone="amber" icon={CalendarClock} className={className}>
        <strong>No active in-person plan.</strong> This clinic charges a desk fee
        {feePhrase ? ` (${feePhrase})` : ""}{" "}
        for a plan-less visit instead of requiring one. Check the patient in and collect it at the desk.
      </Note>
    );
  }
  return (
    <Note tone="amber" icon={CalendarClock} className={className}>
      <strong>No active in-person plan.</strong> In-clinic visits need an active plan before check-in. Sell one at
      the desk from Collect payment (cash, UPI or card; it starts once the payment is recorded), or the patient buys
      it in the app.
    </Note>
  );
}

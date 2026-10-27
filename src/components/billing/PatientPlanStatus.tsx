"use client";

import { BadgeCheck, CalendarClock } from "lucide-react";
import { Note } from "@/components/tbd";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveSubscription } from "@/hooks/query/useBilling";
import { useCurrentClinic } from "@/hooks/query/useClinics";
import { formatDateInIST } from "@/lib/utils/date-time";
import { planStatusOf } from "./plan-status.logic";

/**
 * The clinic's plan-less walk-in rule (`clinic.settings.appointmentSettings.walkInWithoutPlan`,
 * set on the clinic-admin settings screen): REQUIRE_PLAN blocks the desk until the patient has a
 * plan, ALLOW_WITH_DESK_FEE lets the visit go ahead against a desk bill, ALLOW_FREE waives it.
 * Mirrors the backend's own `WalkInPlanWaiver` policy values.
 */
function walkInPolicyOf(clinicSettings: unknown): { policy: "REQUIRE_PLAN" | "ALLOW_WITH_DESK_FEE" | "ALLOW_FREE"; deskFee: number | null } {
  const settings = clinicSettings && typeof clinicSettings === "object" ? (clinicSettings as Record<string, unknown>) : {};
  const appointmentSettings =
    settings.appointmentSettings && typeof settings.appointmentSettings === "object"
      ? (settings.appointmentSettings as Record<string, unknown>)
      : {};
  const value = String(appointmentSettings.walkInWithoutPlan ?? "").toUpperCase();
  const policy = value === "ALLOW_WITH_DESK_FEE" || value === "ALLOW_FREE" ? value : "REQUIRE_PLAN";
  const fee = Number(appointmentSettings.walkInDeskFee);
  return { policy, deskFee: Number.isFinite(fee) && fee > 0 ? Math.round(fee) : null };
}

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
  const { policy, deskFee } = walkInPolicyOf(clinic.data?.settings);
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
        <strong>No active in-person plan.</strong> This clinic charges a desk fee{deskFee ? ` of ₹${deskFee}` : ""}{" "}
        for a plan-less visit instead of requiring one. Check the patient in and collect it at the desk.
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

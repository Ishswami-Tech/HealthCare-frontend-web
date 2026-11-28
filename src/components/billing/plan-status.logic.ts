import type { Subscription } from "@/types/billing.types";

/**
 * The in-person plan model: in-clinic (check-in) visits are covered by the patient's monthly
 * in-person plan (subscription), never by a per-visit consultation fee. Video visits are paid per
 * appointment in the booking flow. These helpers read the plan returned by
 * GET /billing/subscriptions/user/:userId/active.
 */
export interface PlanStatus {
  active: boolean;
  /** End of the current paid period (ISO), when known. */
  activeTill: string | null;
  planName: string;
  /** Visits left in this period; null when the plan is unlimited or the count is unknown. */
  visitsLeft: number | null;
}

export function planStatusOf(subscription: Subscription | null | undefined, now = Date.now()): PlanStatus {
  if (!subscription) return { active: false, activeTill: null, planName: "", visitsLeft: null };
  const status = String(subscription.status ?? "").toUpperCase();
  const activeTill = subscription.currentPeriodEnd || subscription.nextBillingDate || subscription.endDate || null;
  const endMs = activeTill ? new Date(activeTill).getTime() : Number.NaN;
  const active =
    (status === "ACTIVE" || status === "TRIALING") && (!activeTill || (Number.isFinite(endMs) && endMs >= now));
  const left = subscription.appointmentsRemaining ?? subscription.remainingVisits;
  return {
    active,
    activeTill,
    planName: subscription.plan?.name ?? "",
    visitsLeft: typeof left === "number" && Number.isFinite(left) ? left : null,
  };
}

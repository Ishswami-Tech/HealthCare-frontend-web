/**
 * The human (desk) path for a patient without a care plan, in the same words as the mobile app
 * (`HeallthCare-Frontend-Mobile/src/features/booking/walk-in-policy.ts` and
 * `src/features/payments/pay-at-clinic.ts`). Pure, framework-free.
 *
 * Clinic settings (GET /clinics/:id or /clinics/my-clinic), mirrored from the backend's
 * `walk-in-plan-policy.util.ts`:
 *
 *   appointmentSettings.walkInWithoutPlan   'REQUIRE_PLAN' (default) | 'ALLOW_WITH_DESK_FEE' | 'ALLOW_FREE'
 *   appointmentSettings.walkInDeskFee       whole rupees, used by ALLOW_WITH_DESK_FEE
 *
 * "Pay at the clinic" creates nothing: reception sells the plan at the desk (Collect payment ->
 * Sell plan) and the plan starts only once that payment is recorded.
 */

export type WalkInPlanPolicy = "REQUIRE_PLAN" | "ALLOW_WITH_DESK_FEE" | "ALLOW_FREE";

export interface WalkInPlanSettings {
  policy: WalkInPlanPolicy;
  /** Rupees; null when the clinic has not set one (the desk uses the consultation fee then). */
  deskFee: number | null;
}

const POLICIES: readonly WalkInPlanPolicy[] = ["REQUIRE_PLAN", "ALLOW_WITH_DESK_FEE", "ALLOW_FREE"];
const MAX_DESK_FEE = 100_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeDeskFee(value: unknown): number | null {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value.trim()) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) return null;
  const rupees = Math.round(parsed);
  return rupees > 0 && rupees <= MAX_DESK_FEE ? rupees : null;
}

/** The rule from `Clinic.settings`, or null when the settings are not available (not loaded yet). */
export function resolveWalkInPlanSettings(settings: unknown): WalkInPlanSettings | null {
  if (!isRecord(settings)) return null;
  const appointment = isRecord(settings.appointmentSettings) ? settings.appointmentSettings : settings;
  const raw = typeof appointment.walkInWithoutPlan === "string" ? appointment.walkInWithoutPlan.trim().toUpperCase() : "";
  const policy = (POLICIES as readonly string[]).includes(raw) ? (raw as WalkInPlanPolicy) : "REQUIRE_PLAN";
  return { policy, deskFee: normalizeDeskFee(appointment.walkInDeskFee) };
}

const rupees = (amount: number): string => `₹${amount.toLocaleString("en-IN")}`;

/** One plain sentence: what a patient without a plan can do at the clinic (same as mobile). */
export function walkInFallbackText(rule: WalkInPlanSettings | null): string {
  if (rule?.policy === "ALLOW_FREE") {
    return "No plan? Walk in — the reception desk will check you in (no desk fee).";
  }
  if (rule?.policy === "ALLOW_WITH_DESK_FEE" && rule.deskFee) {
    return `No plan? Walk in — the reception desk will check you in (desk fee ${rupees(rule.deskFee)}, pay at the desk).`;
  }
  if (rule?.policy === "REQUIRE_PLAN") {
    return "No plan? Walk in and ask at the reception desk — they can set up a plan and check you in.";
  }
  return "No plan? Walk in — the reception desk will check you in (desk fee as per clinic).";
}

/** Booking, patient without a plan: the notice title and message (same as mobile). */
export const PLAN_NEEDED_TITLE = "A plan is needed to book a clinic visit in the app";
export const PLAN_NEEDED_MESSAGE =
  "In-clinic bookings in the app are covered by a care plan. Buy one online, or pay at the clinic reception (cash, UPI or card).";

const CYCLE_NOUN: Readonly<Record<string, string>> = {
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
  QUARTERLY: "quarter",
  YEARLY: "year",
};

/** "month" for MONTHLY etc.; null for an unknown cycle (the price is then shown without "per"). */
export function planCycleNoun(cycle: string | null | undefined): string | null {
  return CYCLE_NOUN[String(cycle ?? "").toUpperCase()] ?? null;
}

export const PAY_AT_CLINIC_LABEL = "Pay at the clinic";

/**
 * "Pay at the clinic" on a plan: buy it at reception. `priceLabel` is the plan's own price from
 * the API, already formatted; `cycle` is e.g. "month". Never a hardcoded amount.
 */
export function payAtClinicText(plan: { name: string; priceLabel: string; cycle?: string | null }): string {
  const per = plan.cycle ? ` per ${plan.cycle}` : "";
  return (
    `Buy ${plan.name} at the reception desk: ${plan.priceLabel}${per}, by cash, UPI or card (GST, if any, is on the bill). ` +
    "Reception starts the plan as soon as the payment is recorded, then you can book clinic visits here. " +
    "The plan covers in-clinic visits; video consultations are paid per appointment."
  );
}

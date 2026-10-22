export type WashTone = "mint" | "sky" | "lavender" | "sun" | "aqua" | "peach";

/**
 * Section background for a route, the same mapping as the designs:
 *   mint: home, dashboards, queue, check-in · sky: appointments, booking, family
 *   lavender: video, prescriptions, profile, settings, library · sun: billing and payments
 *   aqua: patients, health records, medicines, inventory · peach: reports, help
 */
const WASH_RULES: Array<[RegExp, WashTone]> = [
  [/\/(reports|help|support|lab-booking)(\/|$)/, "peach"],
  [/\/(billing|payments|invoices|subscriptions)(\/|$)/, "sun"],
  [/\/(appointments|no-show|schedule|family|booking)(\/|$)/, "sky"],
  [/\/(prescriptions|prescribe|drafts|dispense|handover|diagnosis|investigations|print-settings|profile|settings|library|sessions)(\/|$)/, "lavender"],
  [/\/(leave|holidays|follow-up|walk-in)(\/|$)/, "sky"],
  [/^\/(pharmacy|ehr)(\/|$)/, "aqua"],
  [/\/(patients|health|medicines|inventory|stock|records|vitals|expiry|alert-settings)(\/|$)/, "aqua"],
  [/\/(dashboard|queue|check-ins?|collect)(\/|$)/, "mint"],
];

export function washToneForPath(pathname?: string | null): WashTone {
  const path = String(pathname ?? "");
  for (const [pattern, tone] of WASH_RULES) {
    if (pattern.test(path)) return tone;
  }
  return "mint";
}

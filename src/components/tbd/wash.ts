export type WashTone = "mint" | "sky" | "lavender" | "sun" | "aqua" | "peach";

/**
 * Section background for a route, the same mapping as the designs:
 *   mint: home, dashboards, queue, check-in · sky: appointments, booking, family
 *   lavender: video, prescriptions, profile, settings, library · sun: billing and payments
 *   aqua: patients, health records, medicines, inventory · peach: reports, help
 */
const WASH_RULES: Array<[RegExp, WashTone]> = [
  [/\/(reports|help|support)(\/|$)/, "peach"],
  [/\/(billing|payments|invoices|subscriptions)(\/|$)/, "sun"],
  [/\/(appointments|no-show|schedule|family|booking)(\/|$)/, "sky"],
  [/\/(prescriptions|profile|settings|library|sessions)(\/|$)/, "lavender"],
  [/^\/(pharmacy|ehr)(\/|$)/, "aqua"],
  [/\/(patients|health|medicines|inventory|records|vitals)(\/|$)/, "aqua"],
  [/\/(dashboard|queue|check-in)(\/|$)/, "mint"],
];

export function washToneForPath(pathname?: string | null): WashTone {
  const path = String(pathname ?? "");
  for (const [pattern, tone] of WASH_RULES) {
    if (pattern.test(path)) return tone;
  }
  return "mint";
}

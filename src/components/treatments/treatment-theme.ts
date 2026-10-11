import type { LucideIcon } from "lucide-react";
import { THERAPY_ACCENT, type AccentName } from "@/lib/design/tokens";

/**
 * Per-therapy colour classes for the treatment pages. Every page uses the same
 * sections; only these strings change. They are spelled out in full because
 * Tailwind only generates classes it can find as literals in the source.
 *
 * The amber theme reproduces the original Agnikarma page exactly.
 */
export interface TreatmentTheme {
  accent: AccentName;
  /** Unique per page: SVG gradient ids must not collide. */
  id: string;

  /* Hero (always dark) */
  heroSection: string;
  heroField: string;
  heroScrimMobile: string;
  heroScrimSide: string;
  heroScrimBottom: string;
  heroBadge: string;
  heroTitleGradient: string;
  heroFeaturePlate: string;
  heroCta: string;
  heroStatCell: string;
  heroStatIcon: string;
  heroAssurance: string;

  /* Hero, theme-aware ("auto") appearance: frosted like the homepage hero */
  autoBadge: string;
  autoTitleGradient: string;
  autoFeaturePlate: string;
  autoStatIcon: string;
  autoAssurance: string;

  /* Light sections */
  tailText: string;
  ledeRule: string;
  glow: string;
  glowSoft: string;
  dotgrid: string;
  divider: string;
  stepCard: string;
  stepBadge: string;
  stepRule: string;
  wave: string;
  standfirstRule: string;
  metricPlate: string;
}

export const TREATMENT_THEMES = {
  amber: {
    accent: THERAPY_ACCENT.agnikarma,
    id: "agnikarma",
    heroSection: "bg-[#1b1008]",
    heroField: "from-[#2a1709] via-[#1b1008] to-[#0d0804]",
    heroScrimMobile: "bg-[#140c06]/78",
    heroScrimSide: "from-[#140c06] via-[#140c06]/85",
    heroScrimBottom: "from-[#140c06] via-transparent to-[#140c06]/55",
    heroBadge: "border-amber-400/30 bg-amber-500/15 text-amber-200",
    heroTitleGradient: "from-amber-300 via-amber-400 to-orange-400",
    heroFeaturePlate: "border-amber-400/35 bg-amber-500/10 text-amber-300",
    heroCta:
      "bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-[0_14px_34px_-12px_rgba(245,158,11,0.75)] hover:from-amber-500 hover:to-orange-600",
    heroStatCell: "bg-[#140c06]/70",
    heroStatIcon: "text-amber-300",
    heroAssurance: "border-amber-300/25 bg-amber-400/10 text-amber-100",
    autoBadge: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    autoTitleGradient: "from-amber-600 via-amber-500 to-orange-500 dark:from-amber-300 dark:via-amber-400 dark:to-orange-400",
    autoFeaturePlate: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    autoStatIcon: "text-amber-600 dark:text-amber-300",
    autoAssurance: "border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-100",
    tailText: "text-amber-600 dark:text-amber-400",
    ledeRule: "bg-amber-900/15 dark:bg-amber-100/15",
    glow: "bg-amber-200/30 dark:bg-amber-900/20",
    glowSoft: "bg-amber-200/20 dark:bg-amber-900/15",
    dotgrid: "text-amber-800",
    divider: "to-amber-600/35",
    stepCard: "bg-linear-to-b from-amber-50/80 to-transparent dark:from-amber-950/30",
    stepBadge: "from-amber-500 to-orange-600",
    stepRule: "bg-amber-600",
    wave: "oklch(0.70 0.16 62)",
    standfirstRule: "bg-amber-500",
    metricPlate: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  violet: {
    accent: THERAPY_ACCENT.viddhakarma,
    id: "viddhakarma",
    heroSection: "bg-[#120c1f]",
    heroField: "from-[#1f1336] via-[#120c1f] to-[#08060f]",
    heroScrimMobile: "bg-[#0d0817]/78",
    heroScrimSide: "from-[#0d0817] via-[#0d0817]/85",
    heroScrimBottom: "from-[#0d0817] via-transparent to-[#0d0817]/55",
    heroBadge: "border-violet-400/30 bg-violet-500/15 text-violet-200",
    heroTitleGradient: "from-violet-300 via-violet-400 to-indigo-300",
    heroFeaturePlate: "border-violet-400/35 bg-violet-500/10 text-violet-300",
    heroCta:
      "bg-linear-to-r from-violet-500 to-indigo-500 text-white shadow-[0_14px_34px_-12px_rgba(139,92,246,0.75)] hover:from-violet-500 hover:to-indigo-600",
    heroStatCell: "bg-[#0d0817]/70",
    heroStatIcon: "text-violet-300",
    heroAssurance: "border-violet-300/25 bg-violet-400/10 text-violet-100",
    autoBadge: "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-200",
    autoTitleGradient: "from-violet-600 via-violet-500 to-indigo-500 dark:from-violet-300 dark:via-violet-400 dark:to-indigo-300",
    autoFeaturePlate: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    autoStatIcon: "text-violet-600 dark:text-violet-300",
    autoAssurance: "border-violet-500/20 bg-violet-500/10 text-violet-900 dark:text-violet-100",
    tailText: "text-violet-600 dark:text-violet-400",
    ledeRule: "bg-violet-900/15 dark:bg-violet-100/15",
    glow: "bg-violet-200/30 dark:bg-violet-900/20",
    glowSoft: "bg-violet-200/20 dark:bg-violet-900/15",
    dotgrid: "text-violet-800",
    divider: "to-violet-600/35",
    stepCard: "bg-linear-to-b from-violet-50/80 to-transparent dark:from-violet-950/30",
    stepBadge: "from-violet-500 to-indigo-600",
    stepRule: "bg-violet-600",
    wave: "oklch(0.58 0.2 292)",
    standfirstRule: "bg-violet-500",
    metricPlate: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  sky: {
    accent: THERAPY_ACCENT.panchakarma,
    id: "panchakarma",
    heroSection: "bg-[#071721]",
    heroField: "from-[#0b2533] via-[#071721] to-[#030b10]",
    heroScrimMobile: "bg-[#05121a]/78",
    heroScrimSide: "from-[#05121a] via-[#05121a]/85",
    heroScrimBottom: "from-[#05121a] via-transparent to-[#05121a]/55",
    heroBadge: "border-sky-400/30 bg-sky-500/15 text-sky-200",
    heroTitleGradient: "from-sky-300 via-sky-400 to-cyan-300",
    heroFeaturePlate: "border-sky-400/35 bg-sky-500/10 text-sky-300",
    heroCta:
      "bg-linear-to-r from-sky-500 to-cyan-500 text-white shadow-[0_14px_34px_-12px_rgba(14,165,233,0.75)] hover:from-sky-500 hover:to-cyan-600",
    heroStatCell: "bg-[#05121a]/70",
    heroStatIcon: "text-sky-300",
    heroAssurance: "border-sky-300/25 bg-sky-400/10 text-sky-100",
    autoBadge: "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200",
    autoTitleGradient: "from-sky-600 via-sky-500 to-cyan-500 dark:from-sky-300 dark:via-sky-400 dark:to-cyan-300",
    autoFeaturePlate: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    autoStatIcon: "text-sky-600 dark:text-sky-300",
    autoAssurance: "border-sky-500/20 bg-sky-500/10 text-sky-900 dark:text-sky-100",
    tailText: "text-sky-600 dark:text-sky-400",
    ledeRule: "bg-sky-900/15 dark:bg-sky-100/15",
    glow: "bg-sky-200/30 dark:bg-sky-900/20",
    glowSoft: "bg-sky-200/20 dark:bg-sky-900/15",
    dotgrid: "text-sky-800",
    divider: "to-sky-600/35",
    stepCard: "bg-linear-to-b from-sky-50/80 to-transparent dark:from-sky-950/30",
    stepBadge: "from-sky-500 to-cyan-600",
    stepRule: "bg-sky-600",
    wave: "oklch(0.66 0.13 232)",
    standfirstRule: "bg-sky-500",
    metricPlate: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
} as const satisfies Record<string, TreatmentTheme>;

export type IconLabel = { icon: LucideIcon; label: string };

/** Splits a title so its final word can take the accent ("Agnikarma Process"). */
export function splitTail(text: string): { lead: string; tail: string } {
  const words = text.trim().split(/\s+/);
  const tail = words.length > 1 ? words[words.length - 1] : undefined;
  if (!tail) return { lead: words.join(" "), tail: "" };
  return { lead: words.slice(0, -1).join(" "), tail };
}

/** Splits "3-5 sessions" into its figure and its unit so each can be sized. */
export function splitValueUnit(text: string): { value: string; unit: string } {
  const trimmed = text.trim();
  const gap = trimmed.indexOf(" ");
  if (gap === -1) return { value: trimmed, unit: "" };
  return { value: trimmed.slice(0, gap).replace("-", "–"), unit: trimmed.slice(gap + 1) };
}

/** Parses "85%" from the translations into 85. */
export function parsePercent(text: string): number {
  const value = Number.parseFloat(text);
  return Number.isFinite(value) ? value : 0;
}

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const VALUE_TONES = {
  ink: "text-ink",
  brand: "text-brand",
  amber: "text-[#b45309] dark:text-amber-300",
  rose: "text-[#be123c] dark:text-rose-300",
  blue: "text-[#1d4ed8] dark:text-blue-300",
} as const;

export type StatTileTone = keyof typeof VALUE_TONES;

/**
 * Compact number tile: big value over its label, optional small line (trend, unit, flag).
 * Used in rows of 3 – 6 on dashboards, the vitals drawer and the queue strips.
 * Unlike `Kpi` it has no icon square, so it fits narrow columns.
 */
export function StatTile({
  value,
  label,
  hint,
  tone = "ink",
  href,
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  tone?: StatTileTone;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <span className={cn("text-[22px] font-extrabold leading-[1.15]", VALUE_TONES[tone])}>{value}</span>
      <span className="text-xs font-bold text-ink-muted">{label}</span>
      {hint ? <span className="text-[11px] text-ink-muted">{hint}</span> : null}
    </>
  );
  const shell = cn(
    "flex min-w-0 flex-col gap-0.5 rounded-2xl bg-card px-4 py-3 shadow-card dark:border dark:border-border/70",
    href && "transition-shadow hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
    className,
  );
  return href ? (
    <Link href={href} className={shell}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

import { MiniStat } from "@/components/tbd";
import type { PharmacyDashboardStats } from "./pharmacist-dashboard.logic";

interface PharmacistDashboardStatsGridProps {
  stats: PharmacyDashboardStats;
  /** First load: show placeholders instead of zeros. */
  loading?: boolean;
}

const TILES: { key: keyof PharmacyDashboardStats; label: string; tone: string }[] = [
  { key: "toFill", label: "To fill", tone: "text-[#1d4ed8] dark:text-blue-300" },
  { key: "paymentDue", label: "Payment due", tone: "text-[#b45309] dark:text-amber-300" },
  { key: "dispensedToday", label: "Dispensed today", tone: "text-brand" },
  { key: "lowStock", label: "Low stock", tone: "text-[#be123c] dark:text-rose-300" },
  { key: "thisMonth", label: "This month", tone: "text-ink-soft" },
];

/** The strip of numbers inside the banner. Every number comes from the pharmacy hooks. */
export function PharmacistDashboardStatsGrid({ stats, loading = false }: PharmacistDashboardStatsGridProps) {
  return (
    <div
      role="group"
      aria-label="Pharmacy numbers"
      aria-busy={loading}
      className="z-[1] grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:w-auto"
    >
      {TILES.map((tile) => (
        <MiniStat
          key={tile.key}
          className="rounded-[14px] bg-white lg:min-w-[124px]"
          value={
            loading ? (
              <span className="my-1 block h-[22px] w-9 animate-pulse rounded-md bg-well" aria-label="Loading" />
            ) : (
              (stats[tile.key] ?? "—")
            )
          }
          label={<span className={`font-bold ${tile.tone}`}>{tile.label}</span>}
        />
      ))}
    </div>
  );
}

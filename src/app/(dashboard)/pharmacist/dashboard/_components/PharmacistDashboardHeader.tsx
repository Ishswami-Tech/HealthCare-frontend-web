import { PageHero } from "@/components/tbd";
import { PharmacistDashboardStatsGrid } from "./PharmacistDashboardStatsGrid";
import type { PharmacyDashboardStats } from "./pharmacist-dashboard.logic";

interface PharmacistDashboardHeaderProps {
  /** Today's date, already formatted ("Saturday, 3 October"). */
  dateLabel: string;
  stats: PharmacyDashboardStats;
  statsLoading?: boolean;
}

/** Page banner with the strip of numbers on the right. */
export function PharmacistDashboardHeader({ dateLabel, stats, statsLoading = false }: PharmacistDashboardHeaderProps) {
  return (
    <PageHero
      eyebrow={dateLabel}
      title="Pharmacy Dashboard"
      description="Manage prescriptions and medical inventory"
      className="p-[22px]"
    >
      <PharmacistDashboardStatsGrid stats={stats} loading={statsLoading} />
    </PageHero>
  );
}

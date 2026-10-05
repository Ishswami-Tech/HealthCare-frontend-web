"use client";

import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";

const PharmacistPrescriptionsContent = dynamic(
  () => import("./_components/PharmacistPrescriptionsContent"),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  },
);

/**
 * Pharmacy prescriptions: Active / History / Batch audit, the "Review dispense" and
 * "Reverse dispense" dialogs. Deep links: `?prescriptionId=<id>`, `?tab=history`.
 */
export default function PharmacistPrescriptionsPage() {
  return <PharmacistPrescriptionsContent />;
}

"use client";

import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";

// Pharmacy inventory (`/pharmacy`): the one inventory screen. Deep links other screens send:
// `?action=add`, `?action=add&item=<medicineId>`, `?filter=low`, `?filter=expiring`.
const PharmacyInventoryContent = dynamic(() => import("./_components/PharmacyInventoryContent"), {
  ssr: false,
  loading: () => <DashboardPageSkeleton />,
});

export default function PharmacyInventoryPage() {
  return <PharmacyInventoryContent />;
}

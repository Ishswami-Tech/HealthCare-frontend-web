"use client";

import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";

const ClinicLocationHeadDashboardContent = dynamic(
  () => import("./_components/ClinicLocationHeadDashboardContent"),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  }
);

export default function ClinicLocationHeadDashboard() {
  return <ClinicLocationHeadDashboardContent />;
}

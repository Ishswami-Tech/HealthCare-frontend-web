"use client";

import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";

const PharmacistDashboardContent = dynamic(
  () => import("./_components/PharmacistDashboardContent"),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  }
);

export default function PharmacistDashboardPage() {
  return <PharmacistDashboardContent />;
}

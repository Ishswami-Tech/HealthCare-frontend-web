"use client";

import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";

const DoctorDashboardContent = dynamic(() => import("./_components/DoctorDashboardContent"), {
  ssr: false,
  loading: () => <DashboardPageSkeleton />,
});

export default function DoctorDashboardPage() {
  return <DoctorDashboardContent />;
}

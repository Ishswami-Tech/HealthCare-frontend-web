"use client";

import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";

const AssistantDoctorDashboardContent = dynamic(
  () => import("./_components/AssistantDoctorDashboardContent"),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  }
);

export default function AssistantDoctorDashboardPage() {
  return <AssistantDoctorDashboardContent />;
}

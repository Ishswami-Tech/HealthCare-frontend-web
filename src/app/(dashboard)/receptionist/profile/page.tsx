"use client";

import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";

const ReceptionistProfileContent = dynamic(
  () => import("./_components/ReceptionistProfileContent"),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  }
);

export default function ReceptionistProfile() {
  return <ReceptionistProfileContent />;
}

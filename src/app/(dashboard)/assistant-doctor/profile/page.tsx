"use client";

import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";

const AssistantDoctorWorkspaceShell = dynamic(
  () => import("../_components/AssistantDoctorWorkspaceShell").then((module) => module.AssistantDoctorWorkspaceShell),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  }
);

export default function AssistantDoctorProfilePage() {
  return (
    <AssistantDoctorWorkspaceShell
      eyebrow="Assistant Doctor"
      title="Profile and availability"
      description="Profile maintenance lives in the shared doctor profile workspace so role-specific settings stay centralized."
      note="Shared profile route"
      actions={[
        {
          label: "Open doctor profile",
          href: "/doctor/profile",
          description: "Review contact details, consultation settings, and availability in one place.",
        },
        {
          label: "Open dashboard",
          href: "/assistant-doctor/dashboard",
          description: "Return to the assistant-doctor operational summary.",
        },
        {
          label: "Open video consultations",
          href: "/assistant-doctor/appointments",
          description: "Check the appointments workspace when availability affects consultations.",
        },
      ]}
    />
  );
}

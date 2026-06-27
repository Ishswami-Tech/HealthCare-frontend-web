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

export default function AssistantDoctorAppointmentsPage() {
  return (
    <AssistantDoctorWorkspaceShell
      eyebrow="Assistant Doctor"
      title="Appointments workspace"
      description="Appointment review lives in the shared doctor calendar so assistant-doctor users can work from the same source of truth."
      note="Shared doctor route"
      actions={[
        {
          label: "Open doctor appointments",
          href: "/doctor/appointments",
          description: "Review the same appointment timeline used by the doctor workspace.",
        },
        {
          label: "Open queue",
          href: "/queue",
          description: "Move directly into live patient flow and consultation handoff.",
        },
        {
          label: "Open video consultations",
          href: "/assistant-doctor/appointments",
          description: "Check video visits and join the consultation room from the appointments workspace.",
        },
      ]}
    />
  );
}

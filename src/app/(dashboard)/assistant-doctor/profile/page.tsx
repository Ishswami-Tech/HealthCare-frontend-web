import { AssistantDoctorWorkspaceShell } from "../_components/AssistantDoctorWorkspaceShell";

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
          href: "/video-appointments",
          description: "Check the video visit list when availability affects consultations.",
        },
      ]}
    />
  );
}

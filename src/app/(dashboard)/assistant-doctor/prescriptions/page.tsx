import { AssistantDoctorWorkspaceShell } from "../_components/AssistantDoctorWorkspaceShell";

export default function AssistantDoctorPrescriptionsPage() {
  return (
    <AssistantDoctorWorkspaceShell
      eyebrow="Assistant Doctor"
      title="Prescription workspace"
      description="Prescription review is handled in the shared doctor workspace so clinical notes stay consistent across roles."
      note="Shared medication route"
      actions={[
        {
          label: "Open doctor prescriptions",
          href: "/doctor/prescriptions",
          description: "Review the shared prescription list and medication plans.",
        },
        {
          label: "Open queue",
          href: "/queue",
          description: "Confirm which patient is next before preparing the prescription handoff.",
        },
        {
          label: "Open billing",
          href: "/billing",
          description: "Check payment context when a prescription depends on an active visit.",
        },
      ]}
    />
  );
}

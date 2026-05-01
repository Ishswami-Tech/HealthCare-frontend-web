import { AssistantDoctorWorkspaceShell } from "../_components/AssistantDoctorWorkspaceShell";

export default function AssistantDoctorPatientsPage() {
  return (
    <AssistantDoctorWorkspaceShell
      eyebrow="Assistant Doctor"
      title="Patient directory"
      description="Patient charts are maintained in the shared doctor workspace so handoffs, EHR lookups, and follow-ups stay aligned."
      note="Shared patient record"
      actions={[
        {
          label: "Open doctor patient directory",
          href: "/doctor/patients",
          description: "Use the shared patient list for chart review and scheduling follow-up care.",
        },
        {
          label: "Open appointments",
          href: "/doctor/appointments",
          description: "Jump back into the appointment timeline for patient-specific context.",
        },
        {
          label: "Open queue",
          href: "/queue",
          description: "Check the live queue for patients waiting on clinical review.",
        },
      ]}
    />
  );
}

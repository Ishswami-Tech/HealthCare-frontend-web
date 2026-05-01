import { AssistantDoctorWorkspaceShell } from "../../_components/AssistantDoctorWorkspaceShell";

export default function AssistantDoctorPatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <AssistantDoctorWorkspaceShell
      eyebrow="Assistant Doctor"
      title="Patient record handoff"
      description="This assistant-doctor route now routes to the shared doctor patient record instead of duplicating a separate workspace."
      note="Shared record"
      actions={[
        {
          label: "Open shared patient record",
          href: `/doctor/patients/${params.id}`,
          description: "Continue into the shared patient detail view for the selected patient.",
        },
        {
          label: "Open patient directory",
          href: "/doctor/patients",
          description: "Return to the shared patient list to search other records.",
        },
        {
          label: "Open queue",
          href: "/queue",
          description: "Check whether the patient is waiting in the live clinic queue.",
        },
      ]}
    />
  );
}

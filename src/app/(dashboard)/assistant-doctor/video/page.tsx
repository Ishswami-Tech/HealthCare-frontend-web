import { AssistantDoctorWorkspaceShell } from "../_components/AssistantDoctorWorkspaceShell";

export default function AssistantDoctorVideoPage() {
  return (
    <AssistantDoctorWorkspaceShell
      eyebrow="Assistant Doctor"
      title="Video consultations"
      description="Video visits are served from the shared video appointments workspace so join and review flows stay aligned across roles."
      note="Shared video route"
      actions={[
        {
          label: "Open video appointments",
          href: "/video-appointments",
          description: "View the shared consultation list and join an active video session.",
        },
        {
          label: "Open doctor appointments",
          href: "/doctor/appointments",
          description: "Check the linked appointment timeline before joining a call.",
        },
        {
          label: "Open queue",
          href: "/queue",
          description: "Move back to the live queue when the video visit is tied to an in-clinic handoff.",
        },
      ]}
    />
  );
}

import { redirect } from "next/navigation";

export default function AssistantDoctorPatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/doctor/patients/${params.id}`);
}

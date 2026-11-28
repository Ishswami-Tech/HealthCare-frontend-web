import { DoctorRxSentView } from "../../_components/DoctorRxSentView";

// DocRxSent (B7): the prescription is with the pharmacy; next steps (`?appointmentId=` links the visit).
export default async function DocRxSentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ appointmentId?: string | string[] }>;
}) {
  const [{ id }, { appointmentId }] = await Promise.all([params, searchParams]);
  return <DoctorRxSentView prescriptionId={id} appointmentId={typeof appointmentId === "string" ? appointmentId : ""} />;
}

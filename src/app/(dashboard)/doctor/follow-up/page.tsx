import { DocFollowUpView } from "@/components/doctor/visit/DocFollowUpView";

// DocFollowUp (B7): book the in-clinic review from a visit (`?appointmentId=`).
export default async function DocFollowUpPage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string | string[] }>;
}) {
  const { appointmentId } = await searchParams;
  return <DocFollowUpView appointmentId={typeof appointmentId === "string" ? appointmentId : ""} />;
}

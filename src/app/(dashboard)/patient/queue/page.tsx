import { PatientQueueContent } from "./_components/PatientQueueContent";

/**
 * Live Queue: the patient's own token, place and estimated wait for today's clinic visit.
 * `appointmentId` (from the visit card's own "Track live queue" link) picks that specific visit;
 * omitted, it falls back to the first checked-in visit (the dashboard card's generic link, and
 * the common case of one in-clinic visit today).
 */
export default async function PatientQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string }>;
}) {
  const { appointmentId } = await searchParams;
  return <PatientQueueContent appointmentId={appointmentId} />;
}

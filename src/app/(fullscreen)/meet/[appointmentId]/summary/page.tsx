import { normalizeVideoSessionAppointmentId } from "@/lib/utils/video-session-route";
import { CallSummaryContent } from "./_components/CallSummaryContent";

export const dynamic = "force-dynamic";

type SummaryPageParams = {
  appointmentId?: string | string[];
};

/** Consultation Summary of a video visit (after the doctor completed it). */
export default async function MeetSummaryPage({
  params,
}: {
  params: Promise<SummaryPageParams>;
}) {
  const resolvedParams = await params;
  const appointmentId = Array.isArray(resolvedParams.appointmentId)
    ? resolvedParams.appointmentId[0]
    : resolvedParams.appointmentId;

  return <CallSummaryContent appointmentId={normalizeVideoSessionAppointmentId(appointmentId || "")} />;
}

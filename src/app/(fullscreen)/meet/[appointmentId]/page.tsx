import { VideoAppointmentMeetSession } from "@/components/video/VideoAppointmentMeetSession";
import { normalizeVideoSessionAppointmentId } from "@/lib/utils/video-session-route";

export const dynamic = "force-dynamic";

type MeetPageParams = {
  appointmentId?: string | string[];
};

export default async function MeetPage({
  params,
}: {
  params: Promise<MeetPageParams>;
}) {
  const resolvedParams = await params;
  const appointmentId = Array.isArray(resolvedParams.appointmentId)
    ? resolvedParams.appointmentId[0]
    : resolvedParams.appointmentId;

  return (
    <VideoAppointmentMeetSession
      appointmentId={normalizeVideoSessionAppointmentId(appointmentId || "")}
    />
  );
}

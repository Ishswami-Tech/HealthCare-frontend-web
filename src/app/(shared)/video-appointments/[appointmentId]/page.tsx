import { VideoAppointmentSession } from "@/components/video/VideoAppointmentSession";
import { normalizeVideoSessionAppointmentId } from "@/lib/utils/video-session-route";

type VideoAppointmentSessionPageParams = {
  appointmentId?: string | string[];
};

export default async function VideoAppointmentSessionPage({
  params,
}: {
  params: Promise<VideoAppointmentSessionPageParams>;
}) {
  const resolvedParams = await params;
  const appointmentId = Array.isArray(resolvedParams.appointmentId)
    ? resolvedParams.appointmentId[0]
    : resolvedParams.appointmentId;

  return <VideoAppointmentSession appointmentId={normalizeVideoSessionAppointmentId(appointmentId || "")} />;
}

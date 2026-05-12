import { VideoAppointmentMeetSession } from "@/components/video/VideoAppointmentMeetSession";
import { getServerSession } from "@/lib/actions/auth.server";
import { normalizeVideoSessionAppointmentId } from "@/lib/utils/video-session-route";

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
  const session = await getServerSession();
  const viewerRole = session?.user?.role || "";

  return (
    <VideoAppointmentMeetSession
      appointmentId={normalizeVideoSessionAppointmentId(appointmentId || "")}
      viewerRole={viewerRole}
    />
  );
}

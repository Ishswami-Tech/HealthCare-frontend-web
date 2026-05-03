import { redirect } from "next/navigation";
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
  const normalizedAppointmentId = normalizeVideoSessionAppointmentId(appointmentId || "");

  if (!normalizedAppointmentId) {
    redirect("/appointments");
  }

  redirect(`/video-appointments/meet/${encodeURIComponent(normalizedAppointmentId)}`);
}

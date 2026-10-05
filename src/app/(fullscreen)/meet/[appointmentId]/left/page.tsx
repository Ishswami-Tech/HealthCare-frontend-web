import { normalizeVideoSessionAppointmentId } from "@/lib/utils/video-session-route";
import { LeftCallContent } from "./_components/LeftCallContent";

export const dynamic = "force-dynamic";

type LeftPageParams = {
  appointmentId?: string | string[];
};

type LeftPageSearchParams = {
  reason?: string | string[];
};

/** "You left the call" / "The call got disconnected" (`?reason=dropped`) for a video visit that is still open. */
export default async function MeetLeftPage({
  params,
  searchParams,
}: {
  params: Promise<LeftPageParams>;
  searchParams: Promise<LeftPageSearchParams>;
}) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const appointmentId = Array.isArray(resolvedParams.appointmentId)
    ? resolvedParams.appointmentId[0]
    : resolvedParams.appointmentId;
  const reason = Array.isArray(resolvedSearch.reason) ? resolvedSearch.reason[0] : resolvedSearch.reason;

  return (
    <LeftCallContent
      appointmentId={normalizeVideoSessionAppointmentId(appointmentId || "")}
      {...(reason ? { reason } : {})}
    />
  );
}

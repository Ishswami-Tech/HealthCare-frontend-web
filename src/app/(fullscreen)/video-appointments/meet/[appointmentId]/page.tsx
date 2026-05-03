import { VideoAppointmentMeetSession } from "@/components/video/VideoAppointmentMeetSession";
import { Header } from "@/components/global/Header";
import { getServerSession } from "@/lib/actions/auth.server";
import { normalizeVideoSessionAppointmentId } from "@/lib/utils/video-session-route";

type VideoAppointmentMeetPageParams = {
  appointmentId?: string | string[];
};

export default async function VideoAppointmentMeetPage({
  params,
}: {
  params: Promise<VideoAppointmentMeetPageParams>;
}) {
  const resolvedParams = await params;
  const appointmentId = Array.isArray(resolvedParams.appointmentId)
    ? resolvedParams.appointmentId[0]
    : resolvedParams.appointmentId;
  const session = await getServerSession();
  const viewerRole = session?.user?.role || "";

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <Header
        showSidebarTrigger={false}
        className="border-border/40 bg-background/90 text-foreground backdrop-blur-md"
      >
        <span className="text-sm font-semibold tracking-tight text-foreground/90">
          Meet
        </span>
      </Header>
      <main className="min-h-0 flex-1 overflow-hidden bg-background">
        <VideoAppointmentMeetSession
          appointmentId={normalizeVideoSessionAppointmentId(appointmentId || "")}
          viewerRole={viewerRole}
        />
      </main>
    </div>
  );
}

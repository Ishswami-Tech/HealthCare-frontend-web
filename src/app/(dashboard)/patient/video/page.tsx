"use client";

import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";
import {
  DashboardPageHeader as PatientPageHeader,
  DashboardPageShell as PatientPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { useAuth } from "@/hooks/auth/useAuth";

export default function PatientVideoPage() {
  const { session } = useAuth();
  const userId = session?.user?.id || "";

  return (
    <PatientPageShell>
      <PatientPageHeader
        eyebrow="Virtual Care"
        title="Video consultations"
        description="Join scheduled online visits, review upcoming virtual appointments, and keep your remote care experience consistent across light and dark mode."
      />
      <VideoAppointmentsList
        title=""
        description=""
        showStatistics={true}
        showJoinButton={true}
        showEndButton={false}
        showDownloadButton={false}
        limit={50}
        filters={{ patientId: userId }}
      />
    </PatientPageShell>
  );
}

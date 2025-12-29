"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";

export default function ReceptionistVideoPage() {
  return (
    <DashboardLayout title="Video Consultations">
      <VideoAppointmentsList
        title="Video Consultations"
        description="View video consultation appointments"
        showStatistics={false}
        showClinicFilter={false}
        showJoinButton={false}
        showEndButton={false}
        showDownloadButton={false}
        limit={100}
      />
    </DashboardLayout>
  );
}

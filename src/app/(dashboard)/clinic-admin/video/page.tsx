"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";

export default function ClinicAdminVideoPage() {
  return (
    <DashboardLayout title="Video Consultations Management">
      <VideoAppointmentsList
        title="Video Consultations Management"
        description="Monitor and manage all video consultations in your clinic"
        showStatistics={true}
        showClinicFilter={false}
        showJoinButton={false}
        showEndButton={true}
        showDownloadButton={true}
        limit={100}
      />
    </DashboardLayout>
  );
}

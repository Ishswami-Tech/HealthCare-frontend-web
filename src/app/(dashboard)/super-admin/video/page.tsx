"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";

export default function SuperAdminVideoPage() {
  return (
    <DashboardLayout title="Video Consultations Management">
      <VideoAppointmentsList
        title="Video Consultations"
        description="Monitor and manage all video consultations across all clinics"
        showStatistics={true}
        showClinicFilter={true}
        showJoinButton={false}
        showEndButton={true}
        showDownloadButton={true}
        limit={200}
      />
    </DashboardLayout>
  );
}


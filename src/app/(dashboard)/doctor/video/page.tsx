"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";
import { useAuth } from "@/hooks/auth/useAuth";

export default function DoctorVideoPage() {
  const { session } = useAuth();
  const userId = session?.user?.id || "";

  return (
    <DashboardLayout title="Video Consultations">
      <VideoAppointmentsList
        title="Video Consultations"
        description="Manage and join video consultations with your patients"
        showStatistics={true}
        showJoinButton={true}
        showEndButton={true}
        showDownloadButton={true}
        limit={50}
        filters={{ doctorId: userId }}
      />
    </DashboardLayout>
  );
}

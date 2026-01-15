"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";
import { useAuth } from "@/hooks/auth/useAuth";

export default function PatientVideoPage() {
  const { session } = useAuth();
  const userId = session?.user?.id || "";

  return (
    <DashboardLayout title="My Video Consultations">
      <VideoAppointmentsList
        title="My Video Consultations"
        description="Join your scheduled video consultations with doctors"
        showStatistics={true}
        showJoinButton={true}
        showEndButton={false}
        showDownloadButton={false}
        limit={50}
        filters={{ patientId: userId }}
      />
    </DashboardLayout>
  );
}

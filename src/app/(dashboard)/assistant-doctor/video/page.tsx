"use client";

import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";
import { useAuth } from "@/hooks/auth/useAuth";

export default function AssistantDoctorVideoPage() {
  const { session } = useAuth();
  const userId = session?.user?.id || "";

  return (
    <VideoAppointmentsList
      title="Video Consultations"
      description="View and join video consultations you are assigned to assist"
      showStatistics={true}
      showJoinButton={true}
      showEndButton={false}
      showDownloadButton={true}
      limit={50}
      filters={{ doctorId: userId }}
    />
  );
}
